import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import { ICON_SIZE } from '../../../constants/icons';
import { adminRequest } from '../../lib/api';
import { MDA_OPTIONS } from '../../lib/mdaRegistry';
import type { ArticleRow } from '../../../../shared/schemas/article';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const GENERATION_JOB_KEY = 'arvid_cms_generation_job';
const POLL_INTERVAL_MS = 3000;

interface GenerationJobRef {
  jobId: string;
  title: string;
  startedAt: number;
  formSnapshot?: {
    slug: string;
    type: 'article' | 'feature' | 'docs';
    status: 'draft' | 'published';
    miniDemoId: string;
    author: string;
  };
}

function saveJobToStorage(job: GenerationJobRef): void {
  try { localStorage.setItem(GENERATION_JOB_KEY, JSON.stringify(job)); } catch { /* storage full */ }
}

function loadJobFromStorage(): GenerationJobRef | null {
  try {
    const raw = localStorage.getItem(GENERATION_JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GenerationJobRef;
    const MAX_AGE_MS = 30 * 60 * 1000;
    if (Date.now() - parsed.startedAt > MAX_AGE_MS) {
      localStorage.removeItem(GENERATION_JOB_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(GENERATION_JOB_KEY);
    return null;
  }
}

function clearJobFromStorage(): void {
  try { localStorage.removeItem(GENERATION_JOB_KEY); } catch { /* ignore */ }
}

interface GenerationResult {
  content: string;
  excerpt: string;
  tags: string[];
  meta_description: string;
}

type EditorTab = 'write' | 'preview';

export function AdminArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [type, setType] = useState<'article' | 'feature' | 'docs'>('article');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [miniDemoId, setMiniDemoId] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [editorTab, setEditorTab] = useState<EditorTab>('write');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyGenerationResult = useCallback((result: GenerationResult) => {
    setContent(result.content);
    if (result.excerpt) setExcerpt(result.excerpt);
    if (result.tags?.length > 0) setTags(result.tags.join(', '));
    if (result.meta_description) setMetaDescription(result.meta_description);
    setEditorTab('preview');
    setGenerating(false);
    clearJobFromStorage();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    setGenerating(true);
    setError(null);

    pollingRef.current = setInterval(async () => {
      try {
        const response = await adminRequest<{ status: string; result?: GenerationResult; error?: string }>(
          'GET',
          `/api/cms/articles/generate/${jobId}`,
        );

        if (response.status === 'completed' && response.result) {
          stopPolling();
          applyGenerationResult(response.result);
        } else if (response.status === 'failed') {
          stopPolling();
          setGenerating(false);
          setError(response.error ?? 'Generation failed');
          clearJobFromStorage();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check generation status';
        if (message.includes('404') || message.includes('not found') || message.includes('expired')) {
          stopPolling();
          setGenerating(false);
          clearJobFromStorage();
        } else {
          console.warn('[warn] [admin:articleForm:poll] Poll failed, will retry', { jobId, message });
        }
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, applyGenerationResult]);

  useEffect(() => {
    const pendingJob = loadJobFromStorage();
    if (pendingJob) {
      console.info('[info] [admin:articleForm] Resuming generation job', { jobId: pendingJob.jobId, title: pendingJob.title });
      setTitle(pendingJob.title);
      if (!slugManual) setSlug(slugify(pendingJob.title));
      if (pendingJob.formSnapshot) {
        const s = pendingJob.formSnapshot;
        setSlug(s.slug);
        setSlugManual(true);
        setType(s.type);
        setStatus(s.status);
        setMiniDemoId(s.miniDemoId);
        setAuthor(s.author);
      }
      startPolling(pendingJob.jobId);
    }
    return stopPolling;
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    adminRequest<ArticleRow>('GET', `/api/cms/articles/${id}`)
      .then((data) => {
        setTitle(data.title);
        setSlug(data.slug);
        setSlugManual(true);
        setType(data.type);
        setStatus(data.status);
        setExcerpt(data.excerpt ?? '');
        setTags((data.tags ?? []).join(', '));
        setMetaDescription(data.meta_description ?? '');
        setMiniDemoId(data.mini_demo_id ?? '');
        setAuthor(data.author ?? '');
        setContent(data.content);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load article';
        setError(message);
        console.error('[error] [admin:articleForm:load]', { id, message });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }, [slugManual]);

  const handleSlugChange = useCallback((value: string) => {
    setSlugManual(true);
    setSlug(value);
  }, []);

  const previewHtml = useMemo(() => {
    if (editorTab !== 'preview' || !content) return '';
    return marked.parse(content) as string;
  }, [editorTab, content]);

  const handleGenerate = useCallback(async () => {
    if (!title.trim()) {
      setError('Enter a title first so Arvid knows what to write about.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const { jobId } = await adminRequest<{ jobId: string }>(
        'POST',
        '/api/cms/articles/generate',
        { title, type },
      );
      saveJobToStorage({
        jobId,
        title,
        startedAt: Date.now(),
        formSnapshot: { slug, type, status, miniDemoId, author },
      });
      startPolling(jobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      setGenerating(false);
      console.error('[error] [admin:articleForm:generate]', { message });
    }
  }, [title, slug, type, status, miniDemoId, author, startPolling]);

  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);

    const body = {
      title,
      slug,
      type,
      status,
      content,
      excerpt: excerpt || null,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      meta_description: metaDescription || null,
      mini_demo_id: miniDemoId || null,
      author: author || null,
    };

    try {
      if (isEditing) {
        await adminRequest('PATCH', `/api/cms/articles/${id}`, body);
      } else {
        await adminRequest('POST', '/api/cms/articles', body);
      }
      navigate('/admin/articles');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      console.error('[error] [admin:articleForm:save]', { message });
    } finally {
      setSaving(false);
    }
  }, [title, slug, type, status, content, excerpt, miniDemoId, author, isEditing, id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base px-6 md:px-10">
        <p className="text-caption text-text-tertiary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base px-6 py-6 md:px-10 md:py-10">
      <div className="mx-auto flex max-w-article-content flex-col gap-6 md:gap-8 lg:max-w-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="btn-ghost flex items-center gap-1 px-2 py-1"
          >
            <ArrowLeft size={ICON_SIZE.sm} />
            <span className="hidden md:inline">Back</span>
          </button>
          <h1 className="text-h3 text-text-primary md:text-h2">
            {isEditing ? 'Edit article' : 'New article'}
          </h1>
        </div>

        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}

        <div className="flex flex-col gap-6">
          <FieldGroup label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder="Article title"
            />
          </FieldGroup>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldGroup label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-3 text-caption-lg text-text-primary focus:border-border-focus focus:outline-none"
              >
                <option value="article">Article</option>
                <option value="feature">Feature</option>
                <option value="docs">Docs</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-3 text-caption-lg text-text-primary focus:border-border-focus focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FieldGroup>
          </div>

          <FieldGroup label="Slug">
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder="url-slug"
            />
          </FieldGroup>

          <FieldGroup label="Mini Demo App">
            <select
              value={miniDemoId}
              onChange={(e) => setMiniDemoId(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-3 text-caption-lg text-text-primary focus:border-border-focus focus:outline-none"
            >
              <option value="">None</option>
              {MDA_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </FieldGroup>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !title.trim()}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={ICON_SIZE.md} />
            {generating ? 'Arvid is writing...' : 'Write with Arvid'}
          </button>

          <FieldGroup label="Author">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={`rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none ${generating ? 'field-generating' : ''}`}
              placeholder="Author name"
            />
          </FieldGroup>

          <FieldGroup label="Excerpt">
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className={`resize-none rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none ${generating ? 'field-generating' : ''}`}
              placeholder="Short description for listing cards"
            />
          </FieldGroup>

          <FieldGroup label="Tags (comma-separated)">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none ${generating ? 'field-generating' : ''}`}
              placeholder="requirements, engineering, knowledge-graph"
            />
          </FieldGroup>

          <FieldGroup label="Meta Description (SEO)">
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={155}
              className={`resize-none rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none ${generating ? 'field-generating' : ''}`}
              placeholder="SEO description for Google search results (max 155 chars)"
            />
            <span className="text-tiny text-text-quaternary">
              {metaDescription.length}/155
            </span>
          </FieldGroup>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-quaternary">Content</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  className={`rounded-comfortable px-3 py-1 text-tiny transition-colors ${
                    editorTab === 'write'
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`rounded-comfortable px-3 py-1 text-tiny transition-colors ${
                    editorTab === 'preview'
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {editorTab === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className={`min-h-[200px] resize-y rounded-comfortable border border-border-default bg-surface-panel p-3 font-mono text-caption text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none md:min-h-[400px] ${generating ? 'field-generating' : ''}`}
                placeholder="Write your article in Markdown..."
              />
            ) : (
              <div
                className="flex min-h-[200px] flex-col gap-6 overflow-x-auto rounded-comfortable border border-border-default bg-surface-panel p-3 text-body text-text-secondary md:min-h-[400px] md:p-4 [&_p]:leading-relaxed [&_strong]:text-text-primary [&_h2]:text-h3 [&_h2]:text-text-primary md:[&_h2]:text-h2 [&_h3]:text-h3 [&_h3]:text-text-primary [&_code]:rounded-standard [&_code]:bg-surface-frost-04 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-caption [&_pre]:overflow-x-auto [&_pre]:rounded-card [&_pre]:bg-surface-frost-04 [&_pre]:p-3 md:[&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-2 [&_blockquote]:border-border-default [&_blockquote]:pl-4 [&_blockquote]:text-text-quaternary [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:pl-6 [&_ol]:list-decimal"
                dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-text-empty">Nothing to preview</p>' }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || !slug.trim()}
            className="btn-primary w-full disabled:opacity-50 md:w-auto"
          >
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create article'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="btn-ghost w-full md:w-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-text-quaternary">{label}</span>
      {children}
    </div>
  );
}
