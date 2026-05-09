import { z } from 'zod';

export const DbColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  isNullable: z.boolean(),
  defaultValue: z.string().nullable(),
  isPrimaryKey: z.boolean(),
  isForeignKey: z.boolean(),
  references: z.object({
    table: z.string(),
    column: z.string(),
  }).nullable(),
});

export const DbTableSchema = z.object({
  name: z.string(),
  schema: z.string(),
  columns: z.array(DbColumnSchema),
  rowCountEstimate: z.number().nullable(),
  hasRls: z.boolean(),
});

export const DbRelationshipSchema = z.object({
  constraintName: z.string(),
  fromTable: z.string(),
  fromColumn: z.string(),
  toTable: z.string(),
  toColumn: z.string(),
  type: z.enum(['one-to-many', 'many-to-many', 'one-to-one']),
});

export const DbFunctionSchema = z.object({
  name: z.string(),
  schema: z.string(),
  language: z.string(),
  returnType: z.string(),
  argumentTypes: z.string(),
});

export const EdgeFunctionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: z.string(),
  version: z.number(),
});

export const DbAnalysisSchema = z.object({
  tables: z.array(DbTableSchema),
  relationships: z.array(DbRelationshipSchema),
  functions: z.array(DbFunctionSchema),
  edgeFunctions: z.array(EdgeFunctionSchema),
  patterns: z.array(z.string()),
  dataModel: z.string(),
  summary: z.string(),
});

export const DbContextRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  supabase_project_ref: z.string(),
  tables: z.array(DbTableSchema),
  relationships: z.array(DbRelationshipSchema),
  functions: z.array(DbFunctionSchema),
  edge_functions: z.array(EdgeFunctionSchema),
  analysis: DbAnalysisSchema.nullable(),
  status: z.enum(['pending', 'fetching', 'ready', 'error']),
  error_message: z.string().nullable(),
  fetched_at: z.string(),
});

export const DbContextSchema = DbContextRowSchema.transform(row => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  supabaseProjectRef: row.supabase_project_ref,
  tables: row.tables,
  relationships: row.relationships,
  functions: row.functions,
  edgeFunctions: row.edge_functions,
  analysis: row.analysis,
  status: row.status,
  errorMessage: row.error_message ?? undefined,
  fetchedAt: row.fetched_at,
}));

export type DbColumn = z.infer<typeof DbColumnSchema>;
export type DbTable = z.infer<typeof DbTableSchema>;
export type DbRelationship = z.infer<typeof DbRelationshipSchema>;
export type DbFunction = z.infer<typeof DbFunctionSchema>;
export type EdgeFunction = z.infer<typeof EdgeFunctionSchema>;
export type DbAnalysis = z.infer<typeof DbAnalysisSchema>;
export type DbContextRow = z.infer<typeof DbContextRowSchema>;
export type DbContext = z.output<typeof DbContextSchema>;
