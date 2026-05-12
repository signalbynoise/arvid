import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const MAX_TEXT_LENGTH = 100_000;

const MIME_PDF = 'application/pdf';
const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MIME_TEXT = 'text/plain';
const MIME_MARKDOWN = 'text/markdown';

const SUPPORTED_MIME_TYPES = [MIME_PDF, MIME_DOCX, MIME_TEXT, MIME_MARKDOWN] as const;

export function isSupportedMimeType(mimeType: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  console.info(
    '[INFO] [documentParser:extractText] Starting extraction',
    JSON.stringify({ mimeType, bufferSize: buffer.length }),
  );

  let text: string;

  switch (mimeType) {
    case MIME_PDF: {
      const { PDFParse } = require('pdf-parse');
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParse(uint8);
      await parser.load();
      const pdfResult = await parser.getText();
      if (typeof pdfResult === 'string') {
        text = pdfResult;
      } else if (pdfResult && typeof pdfResult === 'object' && 'text' in pdfResult) {
        text = (pdfResult as { text: string }).text;
      } else {
        text = JSON.stringify(pdfResult);
      }
      parser.destroy();
      break;
    }
    case MIME_DOCX: {
      const mammothModule = require('mammoth');
      const mammoth = mammothModule.default ?? mammothModule;
      console.info('[INFO] [documentParser:extractText] mammoth resolved', JSON.stringify({ hasExtract: typeof mammoth.extractRawText }));
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case MIME_TEXT:
    case MIME_MARKDOWN: {
      text = buffer.toString('utf-8');
      break;
    }
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  const trimmed = text.length > MAX_TEXT_LENGTH
    ? text.slice(0, MAX_TEXT_LENGTH)
    : text;

  console.info(
    '[INFO] [documentParser:extractText] Extraction complete',
    JSON.stringify({ originalLength: text.length, returnedLength: trimmed.length }),
  );

  return trimmed;
}
