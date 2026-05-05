import { describe, it, expect } from 'vitest';
import { analyzeRepo } from './repoAnalyzer';
import type { FileTreeEntry, CommitEntry } from '../../shared/schemas/repoContext';

describe('analyzeRepo', () => {
  const baseTree: FileTreeEntry[] = [
    { path: 'src/app/App.tsx', type: 'blob', size: 2000 },
    { path: 'src/app/store/index.ts', type: 'blob', size: 500 },
    { path: 'src/app/components/Button.tsx', type: 'blob', size: 800 },
    { path: 'src/styles/index.css', type: 'blob', size: 300 },
    { path: 'server/index.ts', type: 'blob', size: 1200 },
    { path: 'server/routes/api.ts', type: 'blob', size: 900 },
    { path: 'package.json', type: 'blob', size: 1500 },
    { path: 'tsconfig.json', type: 'blob', size: 400 },
    { path: 'README.md', type: 'blob', size: 3000 },
    { path: 'src', type: 'tree' },
    { path: 'server', type: 'tree' },
  ];

  const baseKeyFiles: Record<string, string> = {
    'package.json': JSON.stringify({
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        express: '^5.0.0',
        zustand: '^5.0.0',
        'react-router-dom': '^7.0.0',
      },
      devDependencies: {
        typescript: '^5.3.0',
        vitest: '^2.0.0',
        vite: '^6.0.0',
        tailwindcss: '^4.0.0',
      },
    }),
    'tsconfig.json': JSON.stringify({
      compilerOptions: { strict: true },
    }),
  };

  const baseCommits: CommitEntry[] = [
    { sha: 'abc123', message: 'Add auth flow', author: 'Alice', date: new Date().toISOString() },
    { sha: 'def456', message: 'Fix button styles', author: 'Bob', date: new Date().toISOString() },
    { sha: 'ghi789', message: 'Update deps', author: 'Alice', date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  it('detects languages from file extensions', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);

    expect(result.languages.length).toBeGreaterThan(0);
    const tsLang = result.languages.find(l => l.name === 'TypeScript');
    expect(tsLang).toBeDefined();
    expect(tsLang!.percentage).toBeGreaterThan(50);
  });

  it('extracts dependencies from package.json', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);

    expect(result.dependencies.length).toBeGreaterThan(0);
    const reactDep = result.dependencies.find(d => d.name === 'react');
    expect(reactDep).toBeDefined();
    expect(reactDep!.type).toBe('runtime');

    const vitestDep = result.dependencies.find(d => d.name === 'vitest');
    expect(vitestDep).toBeDefined();
    expect(vitestDep!.type).toBe('dev');
  });

  it('detects frameworks from dependencies', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);

    expect(result.frameworks).toContain('React');
    expect(result.frameworks).toContain('Express');
    expect(result.frameworks).toContain('Tailwind CSS');
  });

  it('detects test framework', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.testFramework).toBe('Vitest');
  });

  it('detects build tool', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.buildTool).toBe('Vite');
  });

  it('detects fullstack pattern', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.patterns).toContain('Fullstack');
  });

  it('detects REST API pattern', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.patterns).toContain('REST API');
  });

  it('detects SPA pattern', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.patterns).toContain('SPA');
  });

  it('detects TypeScript strict', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.patterns).toContain('TypeScript strict');
  });

  it('detects Zustand state management', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.patterns).toContain('Zustand state management');
  });

  it('generates a summary string', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.summary).toContain('TypeScript');
    expect(result.summary.length).toBeGreaterThan(20);
  });

  it('counts recent commits in summary', () => {
    const result = analyzeRepo(baseTree, baseKeyFiles, baseCommits);
    expect(result.summary).toContain('2 commits in the last 30 days');
    expect(result.summary).toContain('2 contributors');
  });

  it('detects GitHub Actions CI/CD', () => {
    const treeWithCI: FileTreeEntry[] = [
      ...baseTree,
      { path: '.github/workflows/ci.yml', type: 'blob', size: 500 },
    ];
    const result = analyzeRepo(treeWithCI, baseKeyFiles, baseCommits);
    expect(result.cicd).toBe('GitHub Actions');
  });

  it('detects monorepo pattern', () => {
    const treeWithPackages: FileTreeEntry[] = [
      ...baseTree,
      { path: 'packages/ui/index.ts', type: 'blob', size: 200 },
      { path: 'packages/api/index.ts', type: 'blob', size: 200 },
    ];
    const result = analyzeRepo(treeWithPackages, baseKeyFiles, baseCommits);
    expect(result.patterns).toContain('Monorepo');
  });

  it('handles empty inputs gracefully', () => {
    const result = analyzeRepo([], {}, []);
    expect(result.languages).toEqual([]);
    expect(result.dependencies).toEqual([]);
    expect(result.frameworks).toEqual([]);
    expect(result.patterns).toEqual([]);
    expect(result.testFramework).toBeNull();
    expect(result.buildTool).toBeNull();
    expect(result.cicd).toBeNull();
    expect(result.summary).toBeDefined();
  });

  it('skips node_modules files', () => {
    const treeWithNodeModules: FileTreeEntry[] = [
      { path: 'node_modules/react/index.js', type: 'blob', size: 100 },
      { path: 'node_modules/express/index.js', type: 'blob', size: 100 },
      { path: 'src/app.ts', type: 'blob', size: 100 },
    ];
    const result = analyzeRepo(treeWithNodeModules, {}, []);
    expect(result.languages).toHaveLength(1);
    expect(result.languages[0].name).toBe('TypeScript');
  });

  it('parses Python requirements.txt', () => {
    const keyFiles = {
      'requirements.txt': 'django==4.2.0\ncelery>=5.0\n# comment\nredis\n',
    };
    const result = analyzeRepo([], keyFiles, []);
    expect(result.dependencies).toHaveLength(3);
    expect(result.dependencies.find(d => d.name === 'django')).toBeDefined();
  });
});
