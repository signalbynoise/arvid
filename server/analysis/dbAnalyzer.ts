import type { DbTable, DbRelationship, DbFunction, EdgeFunction, DbAnalysis } from '../../shared/schemas/dbContext';

const PATTERN_DETECTORS: Array<{ name: string; detect: (tables: DbTable[], relationships: DbRelationship[]) => boolean }> = [
  {
    name: 'UUID primary keys',
    detect: (tables) => {
      const withPk = tables.filter(t => t.columns.some(c => c.isPrimaryKey));
      const withUuid = withPk.filter(t => t.columns.some(c => c.isPrimaryKey && c.type === 'uuid'));
      return withPk.length > 0 && withUuid.length / withPk.length > 0.5;
    },
  },
  {
    name: 'Soft deletes',
    detect: (tables) => tables.some(t =>
      t.columns.some(c => c.name === 'is_deleted' || c.name === 'deleted_at'),
    ),
  },
  {
    name: 'Row Level Security',
    detect: (tables) => tables.filter(t => t.hasRls).length > tables.length * 0.3,
  },
  {
    name: 'Timestamped records',
    detect: (tables) => tables.filter(t =>
      t.columns.some(c => c.name === 'created_at') &&
      t.columns.some(c => c.name === 'updated_at'),
    ).length > tables.length * 0.3,
  },
  {
    name: 'Multi-tenant',
    detect: (tables) => tables.filter(t =>
      t.columns.some(c =>
        c.name === 'workspace_id' || c.name === 'organization_id' || c.name === 'tenant_id',
      ),
    ).length >= 2,
  },
  {
    name: 'Auth-linked (user_id FK)',
    detect: (tables) => tables.filter(t =>
      t.columns.some(c => c.name === 'user_id' && c.isForeignKey),
    ).length >= 2,
  },
  {
    name: 'Polymorphic associations',
    detect: (tables) => tables.some(t =>
      t.columns.some(c => c.name === 'entity_type' || c.name === 'resource_type'),
    ),
  },
  {
    name: 'Junction tables (many-to-many)',
    detect: (_tables, relationships) =>
      relationships.filter(r => r.type === 'many-to-many').length > 0,
  },
  {
    name: 'Hierarchical data',
    detect: (tables) => tables.some(t =>
      t.columns.some(c => c.name === 'parent_id' && c.isForeignKey),
    ),
  },
];

export function analyzeDb(
  tables: DbTable[],
  relationships: DbRelationship[],
  functions: DbFunction[],
  edgeFunctions: EdgeFunction[],
): DbAnalysis {
  const patterns = detectPatterns(tables, relationships);
  const dataModel = inferDataModel(tables, relationships);
  const summary = buildSummary(tables, relationships, functions, edgeFunctions, patterns);

  return {
    tables,
    relationships,
    functions,
    edgeFunctions,
    patterns,
    dataModel,
    summary,
  };
}

function detectPatterns(tables: DbTable[], relationships: DbRelationship[]): string[] {
  return PATTERN_DETECTORS
    .filter(d => d.detect(tables, relationships))
    .map(d => d.name);
}

function inferDataModel(tables: DbTable[], relationships: DbRelationship[]): string {
  const tableNames = tables.map(t => t.name);

  const domainHints: Record<string, string[]> = {
    'E-commerce': ['products', 'orders', 'cart', 'payments', 'customers', 'invoices'],
    'Social platform': ['posts', 'comments', 'likes', 'followers', 'feeds', 'messages'],
    'SaaS': ['subscriptions', 'plans', 'billing', 'tenants', 'organizations', 'workspaces'],
    'CMS': ['pages', 'articles', 'categories', 'tags', 'media', 'authors'],
    'Project management': ['tasks', 'projects', 'sprints', 'boards', 'issues', 'milestones'],
    'Authentication system': ['users', 'sessions', 'roles', 'permissions', 'tokens'],
    'Messaging': ['messages', 'conversations', 'channels', 'threads', 'participants'],
    'Analytics': ['events', 'metrics', 'sessions', 'pageviews', 'funnels'],
    'Inventory': ['products', 'inventory', 'warehouses', 'shipments', 'suppliers'],
  };

  let bestMatch = '';
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(domainHints)) {
    const matches = keywords.filter(k => tableNames.some(t => t.includes(k)));
    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestMatch = domain;
    }
  }

  const entityList = tables
    .filter(t => t.schema === 'public')
    .slice(0, 8)
    .map(t => t.name)
    .join(', ');

  if (bestScore >= 2) {
    return `${bestMatch} domain with entities: ${entityList}`;
  }

  return `Custom application with entities: ${entityList}`;
}

function buildSummary(
  tables: DbTable[],
  relationships: DbRelationship[],
  functions: DbFunction[],
  edgeFunctions: EdgeFunction[],
  patterns: string[],
): string {
  const parts: string[] = [];

  const publicTables = tables.filter(t => t.schema === 'public');
  parts.push(`${publicTables.length} public table${publicTables.length !== 1 ? 's' : ''}`);

  if (relationships.length > 0) {
    parts.push(`${relationships.length} foreign key relationship${relationships.length !== 1 ? 's' : ''}`);
  }

  if (functions.length > 0) {
    parts.push(`${functions.length} database function${functions.length !== 1 ? 's' : ''}`);
  }

  if (edgeFunctions.length > 0) {
    parts.push(`${edgeFunctions.length} edge function${edgeFunctions.length !== 1 ? 's' : ''}`);
  }

  const rlsCount = tables.filter(t => t.hasRls).length;
  if (rlsCount > 0) {
    parts.push(`RLS enabled on ${rlsCount}/${tables.length} tables`);
  }

  let summary = parts.join(', ') + '.';

  if (patterns.length > 0) {
    summary += ` Patterns: ${patterns.slice(0, 4).join(', ')}.`;
  }

  return summary;
}
