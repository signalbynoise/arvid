/**
 * Figma URL parsing utilities.
 * Shared between client and server to ensure consistent URL validation
 * and key/node extraction.
 */

export const FIGMA_LINK_REGEX =
  /^https:\/\/(?:www\.)?figma\.com\/(design|file|proto|board|slides)\/([a-zA-Z0-9]+)/;

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId: string | null;
  editorType: 'design' | 'file' | 'proto' | 'board' | 'slides';
}

export function parseFigmaUrl(url: string): ParsedFigmaUrl | null {
  const match = url.trim().match(FIGMA_LINK_REGEX);
  if (!match) return null;

  const editorType = match[1] as ParsedFigmaUrl['editorType'];
  const fileKey = match[2];

  let nodeId: string | null = null;
  try {
    const parsed = new URL(url.trim());
    const rawNodeId = parsed.searchParams.get('node-id');
    if (rawNodeId) {
      nodeId = rawNodeId.replace(/-/g, ':');
    }
  } catch {
    // URL constructor may throw for malformed URLs; fileKey is still usable
  }

  return { fileKey, nodeId, editorType };
}

export function isValidFigmaUrl(url: string): boolean {
  return FIGMA_LINK_REGEX.test(url.trim());
}
