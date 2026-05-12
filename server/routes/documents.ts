import { Router } from 'express';
import multer from 'multer';
import { createUserClient, supabaseAdmin, hasServiceKey } from '../supabase';
import { extractText, isSupportedMimeType } from '../lib/documentParser';
import { analyzeDocument } from '../openrouter';
import { sendSlackNotification } from '../lib/slackNotifier';
import { ConfirmDocumentRequirementsBodySchema } from '../../shared/schemas/documentUpload';

export const documentsRouter = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (isSupportedMimeType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

documentsRouter.post('/upload/:projectId', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error(
        '[ERROR] [documents:upload] Multer error',
        JSON.stringify({ error: err.message, code: (err as { code?: string }).code }),
      );
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, async (req, res) => {
  try {
    const { projectId } = req.params;
    const file = req.file;

    console.info(
      '[INFO] [documents:upload] Upload request received',
      JSON.stringify({ projectId, hasFile: !!file, filename: file?.originalname }),
    );

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const userId = req.user!.id;
    const db = createUserClient(req.accessToken!);

    console.info(
      '[INFO] [documents:upload] Checking project access',
      JSON.stringify({ projectId, userId }),
    );

    const { data: project, error: projectError } = await db
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.warn(
        '[WARN] [documents:upload] Project not found or access denied',
        JSON.stringify({ projectId, error: projectError?.message }),
      );
      res.status(404).json({ error: 'Project not found or access denied' });
      return;
    }

    const uploadId = crypto.randomUUID();
    const storagePath = `${projectId}/${uploadId}/${file.originalname}`;

    console.info(
      '[INFO] [documents:upload] Uploading to storage',
      JSON.stringify({ projectId, uploadId, storagePath, fileSize: file.size }),
    );

    const { error: storageError } = await db.storage
      .from('document-uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) {
      console.error(
        '[ERROR] [documents:upload] Storage upload failed',
        JSON.stringify({ projectId, uploadId, error: storageError.message, statusCode: (storageError as unknown as { statusCode?: string }).statusCode, name: storageError.name }),
      );
      res.status(500).json({ error: 'Failed to store file', detail: storageError.message });
      return;
    }

    const { error: insertError } = await db
      .from('document_uploads')
      .insert({
        id: uploadId,
        project_id: projectId,
        uploaded_by: userId,
        filename: file.originalname,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.mimetype,
        status: 'processing',
      });

    if (insertError) {
      console.error(
        '[ERROR] [documents:upload] DB insert failed',
        JSON.stringify({ projectId, uploadId, error: insertError.message }),
      );
      res.status(500).json({ error: 'Failed to create upload record' });
      return;
    }

    console.info(
      '[INFO] [documents:upload] Upload record created, returning 201',
      JSON.stringify({ uploadId }),
    );

    res.status(201).json({ uploadId, status: 'processing' });

    processDocument(uploadId, projectId, file.buffer, file.mimetype, file.originalname, req.accessToken!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      '[ERROR] [documents:upload] UNHANDLED EXCEPTION in async handler',
      JSON.stringify({ error: message, stack }),
    );
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', detail: message });
    }
  }
});

async function processDocument(
  uploadId: string,
  projectId: string,
  buffer: Buffer,
  mimeType: string,
  filename: string,
  accessToken: string,
): Promise<void> {
  const adminDb = hasServiceKey ? supabaseAdmin : createUserClient(accessToken);

  try {
    console.info(
      '[INFO] [documents:processDocument] Starting async processing',
      JSON.stringify({ uploadId, projectId, filename, usingServiceKey: hasServiceKey }),
    );

    const text = await extractText(buffer, mimeType);

    const { data: existingReqs } = await adminDb
      .from('requirements')
      .select('title')
      .eq('project_id', projectId)
      .eq('is_deactivated', false);

    const existingTitles = (existingReqs ?? []).map(r => r.title);
    const requirements = await analyzeDocument(text, filename, existingTitles);

    await adminDb
      .from('document_uploads')
      .update({
        status: 'completed',
        extracted_text: text,
        extracted_requirements: requirements,
        extracted_count: requirements.length,
        extracted_at: new Date().toISOString(),
      })
      .eq('id', uploadId);

    console.info(
      '[INFO] [documents:processDocument] Processing complete',
      JSON.stringify({ uploadId, requirementCount: requirements.length }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [documents:processDocument] Processing failed',
      JSON.stringify({ uploadId, error: message }),
    );

    await adminDb
      .from('document_uploads')
      .update({
        status: 'failed',
        error_message: message,
      })
      .eq('id', uploadId);
  }
}

documentsRouter.get('/status/:uploadId', async (req, res) => {
  const { uploadId } = req.params;
  const db = createUserClient(req.accessToken!);

  const { data, error } = await db
    .from('document_uploads')
    .select('id, project_id, filename, status, error_message, extracted_count, created_at')
    .eq('id', uploadId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Upload not found' });
    return;
  }

  res.json(data);
});

documentsRouter.get('/preview-url/:uploadId', async (req, res) => {
  const { uploadId } = req.params;
  const db = createUserClient(req.accessToken!);

  const { data: upload, error } = await db
    .from('document_uploads')
    .select('storage_path')
    .eq('id', uploadId)
    .single();

  if (error || !upload) {
    res.status(404).json({ error: 'Upload not found' });
    return;
  }

  const { data: signedUrl, error: urlError } = await db.storage
    .from('document-uploads')
    .createSignedUrl(upload.storage_path, 3600);

  if (urlError || !signedUrl) {
    res.status(500).json({ error: 'Failed to generate preview URL' });
    return;
  }

  res.json({ url: signedUrl.signedUrl });
});

documentsRouter.get('/results/:uploadId', async (req, res) => {
  const { uploadId } = req.params;
  const db = createUserClient(req.accessToken!);

  const { data, error } = await db
    .from('document_uploads')
    .select('extracted_requirements, status, filename')
    .eq('id', uploadId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Upload not found' });
    return;
  }

  if (data.status !== 'completed') {
    res.status(409).json({ error: 'Document has not been processed yet', status: data.status });
    return;
  }

  res.json({
    filename: data.filename,
    requirements: data.extracted_requirements ?? [],
  });
});

documentsRouter.post('/confirm/:uploadId', async (req, res) => {
  const { uploadId } = req.params;
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;

  const parsed = ConfirmDocumentRequirementsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
    return;
  }

  const { data: upload, error: uploadError } = await db
    .from('document_uploads')
    .select('project_id, filename, status')
    .eq('id', uploadId)
    .single();

  if (uploadError || !upload) {
    res.status(404).json({ error: 'Upload not found' });
    return;
  }

  if (upload.status !== 'completed') {
    res.status(409).json({ error: 'Document has not been processed yet' });
    return;
  }

  const { requirements } = parsed.data;
  const source = `Extracted from ${upload.filename}`;
  const createdIds: string[] = [];

  for (const item of requirements) {
    const { data: created, error: createError } = await db
      .from('requirements')
      .insert({
        title: item.title,
        description: item.description,
        clarity: item.clarity,
        risk: item.risk,
        owner: item.owner ?? 'Unassigned',
        source,
        project_id: upload.project_id,
        created_by: userId,
      })
      .select('id')
      .single();

    if (createError) {
      console.error(
        '[ERROR] [documents:confirm] Failed to create requirement',
        JSON.stringify({ uploadId, title: item.title, error: createError.message }),
      );
      continue;
    }

    if (created) {
      createdIds.push(created.id);
    }
  }

  if (createdIds.length > 0) {
    sendSlackNotification({
      projectId: upload.project_id,
      eventType: 'requirements_extracted',
      title: `${createdIds.length} requirement${createdIds.length !== 1 ? 's' : ''} extracted from ${upload.filename}`,
      summary: requirements.slice(0, 3).map(r => `• ${r.title}`).join('\n'),
      entityId: uploadId,
    }).catch(err => {
      console.error(
        '[ERROR] [documents:confirm] Slack notification failed',
        JSON.stringify({ uploadId, error: err instanceof Error ? err.message : 'Unknown' }),
      );
    });
  }

  res.json({ created: createdIds.length, ids: createdIds });
});
