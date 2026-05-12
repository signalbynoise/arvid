const FIGMA_API_BASE = 'https://api.figma.com';

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
  componentId?: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

interface FigmaFileNodesResponse {
  name: string;
  nodes: Record<string, { document: FigmaNode; components: Record<string, { name: string; description: string }> } | null>;
}

interface FigmaImagesResponse {
  images: Record<string, string | null>;
}

interface FigmaUser {
  id: string;
  handle: string;
  email: string;
  img_url: string;
}

export interface FigmaDesignData {
  url: string;
  fileKey: string;
  nodeId: string | null;
  nodeName: string;
  thumbnailUrl: string | null;
  structuralSummary: string;
}

async function figmaFetch<T>(token: string, path: string): Promise<T> {
  console.info(
    '[INFO] [figmaClient:fetch] Requesting Figma API',
    JSON.stringify({ path }),
  );

  const res = await fetch(`${FIGMA_API_BASE}${path}`, {
    headers: { 'X-Figma-Token': token },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(
      '[ERROR] [figmaClient:fetch] Figma API error',
      JSON.stringify({ path, status: res.status, body: body.substring(0, 200) }),
    );
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getMe(token: string): Promise<FigmaUser> {
  console.info('[INFO] [figmaClient:getMe] Validating Figma token');
  const user = await figmaFetch<FigmaUser>(token, '/v1/me');
  console.info('[INFO] [figmaClient:getMe] Token valid', JSON.stringify({ handle: user.handle }));
  return user;
}

export async function getFileNodes(
  token: string,
  fileKey: string,
  nodeIds: string[],
  depth = 2,
): Promise<FigmaFileNodesResponse> {
  const ids = nodeIds.join(',');
  console.info(
    '[INFO] [figmaClient:getFileNodes] Fetching nodes',
    JSON.stringify({ fileKey, nodeIds, depth }),
  );

  const data = await figmaFetch<FigmaFileNodesResponse>(
    token,
    `/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}&depth=${depth}`,
  );

  console.info(
    '[INFO] [figmaClient:getFileNodes] Nodes fetched',
    JSON.stringify({ fileKey, nodeCount: Object.keys(data.nodes).length }),
  );
  return data;
}

export async function getImages(
  token: string,
  fileKey: string,
  nodeIds: string[],
  format: 'png' | 'jpg' | 'svg' = 'png',
  scale = 2,
): Promise<FigmaImagesResponse> {
  const ids = nodeIds.join(',');
  console.info(
    '[INFO] [figmaClient:getImages] Rendering images',
    JSON.stringify({ fileKey, nodeIds, format, scale }),
  );

  const data = await figmaFetch<FigmaImagesResponse>(
    token,
    `/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`,
  );

  console.info(
    '[INFO] [figmaClient:getImages] Images rendered',
    JSON.stringify({ fileKey, imageCount: Object.keys(data.images).length }),
  );
  return data;
}

export function extractDesignSummary(node: FigmaNode, depth = 0): string {
  const MAX_DEPTH = 3;
  const indent = '  '.repeat(depth);
  const parts: string[] = [];

  const dims = node.absoluteBoundingBox
    ? `, ${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)}`
    : '';

  parts.push(`${indent}${node.name} (${node.type}${dims})`);

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    const dir = node.layoutMode === 'HORIZONTAL' ? 'Horizontal' : 'Vertical';
    const spacing = node.itemSpacing != null ? `, gap ${node.itemSpacing}px` : '';
    const padding = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]
      .filter(v => v != null && v > 0);
    const pad = padding.length > 0 ? `, padding ${padding.join('/')}px` : '';
    parts.push(`${indent}  Layout: ${dir} auto-layout${spacing}${pad}`);
  }

  if (node.characters) {
    const text = node.characters.length > 100
      ? node.characters.substring(0, 100) + '...'
      : node.characters;
    parts.push(`${indent}  Text: "${text}"`);
  }

  if (node.children && depth < MAX_DEPTH) {
    for (const child of node.children) {
      parts.push(extractDesignSummary(child, depth + 1));
    }
  } else if (node.children && depth >= MAX_DEPTH) {
    parts.push(`${indent}  ... ${node.children.length} children`);
  }

  return parts.join('\n');
}
