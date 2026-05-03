import { z } from 'zod';

export const ProjectSchema: z.ZodType<Project> = z.object({
  id: z.string(),
  name: z.string(),
  subProjects: z.lazy(() => z.array(ProjectSchema)).optional(),
});

export interface Project {
  id: string;
  name: string;
  subProjects?: Project[];
}
