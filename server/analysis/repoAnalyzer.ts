import type { FileTreeEntry, CommitEntry, RepoAnalysis } from '../../shared/schemas/repoContext';

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  py: 'Python',
  rb: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  swift: 'Swift',
  cs: 'C#',
  cpp: 'C++',
  c: 'C',
  h: 'C',
  hpp: 'C++',
  php: 'PHP',
  dart: 'Dart',
  scala: 'Scala',
  ex: 'Elixir',
  exs: 'Elixir',
  erl: 'Erlang',
  hs: 'Haskell',
  lua: 'Lua',
  r: 'R',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'SASS',
  less: 'LESS',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  md: 'Markdown',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  toml: 'TOML',
  xml: 'XML',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  dockerfile: 'Docker',
};

const FRAMEWORK_DETECTION: Record<string, string> = {
  'react': 'React',
  'react-dom': 'React',
  'next': 'Next.js',
  'vue': 'Vue',
  'nuxt': 'Nuxt',
  '@angular/core': 'Angular',
  'svelte': 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  'express': 'Express',
  'fastify': 'Fastify',
  'koa': 'Koa',
  'hono': 'Hono',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'rails': 'Rails',
  'spring-boot': 'Spring Boot',
  'tailwindcss': 'Tailwind CSS',
  '@mui/material': 'Material UI',
  'chakra-ui': 'Chakra UI',
  '@supabase/supabase-js': 'Supabase',
  'prisma': 'Prisma',
  'drizzle-orm': 'Drizzle',
  'typeorm': 'TypeORM',
  'sequelize': 'Sequelize',
  'mongoose': 'Mongoose',
  'graphql': 'GraphQL',
  '@apollo/server': 'Apollo GraphQL',
  'trpc': 'tRPC',
  '@trpc/server': 'tRPC',
  'electron': 'Electron',
  'react-native': 'React Native',
  'expo': 'Expo',
  'flutter': 'Flutter',
};

const TEST_FRAMEWORK_DETECTION: Record<string, string> = {
  'vitest': 'Vitest',
  'jest': 'Jest',
  'mocha': 'Mocha',
  'ava': 'AVA',
  'cypress': 'Cypress',
  'playwright': 'Playwright',
  '@testing-library/react': 'Testing Library',
  'pytest': 'pytest',
  'rspec': 'RSpec',
  'junit': 'JUnit',
};

const BUILD_TOOL_DETECTION: Record<string, string> = {
  'vite': 'Vite',
  'webpack': 'webpack',
  'rollup': 'Rollup',
  'esbuild': 'esbuild',
  'parcel': 'Parcel',
  'turbo': 'Turborepo',
  'nx': 'Nx',
  'tsup': 'tsup',
};

export function analyzeRepo(
  fileTree: FileTreeEntry[],
  keyFiles: Record<string, string>,
  commits: CommitEntry[],
): RepoAnalysis {
  const languages = analyzeLanguages(fileTree);
  const dependencies = analyzeDependencies(keyFiles);
  const frameworks = detectFrameworks(dependencies);
  const testFramework = detectTestFramework(dependencies);
  const buildTool = detectBuildTool(dependencies, keyFiles);
  const cicd = detectCICD(fileTree, keyFiles);
  const patterns = detectPatterns(fileTree, keyFiles, dependencies);
  const summary = buildSummary(languages, frameworks, patterns, commits);

  return {
    languages,
    dependencies,
    patterns,
    frameworks,
    testFramework,
    buildTool,
    cicd,
    summary,
  };
}

function analyzeLanguages(fileTree: FileTreeEntry[]): RepoAnalysis['languages'] {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const entry of fileTree) {
    if (entry.type !== 'blob') continue;
    if (entry.path.includes('node_modules/')) continue;
    if (entry.path.includes('vendor/')) continue;
    if (entry.path.includes('.min.')) continue;
    if (entry.path.startsWith('.')) continue;

    const ext = getExtension(entry.path);
    if (!ext) continue;

    const lang = EXTENSION_LANGUAGE_MAP[ext];
    if (!lang) continue;
    if (lang === 'JSON' || lang === 'Markdown' || lang === 'YAML' || lang === 'XML' || lang === 'TOML') continue;

    counts[lang] = (counts[lang] || 0) + 1;
    total++;
  }

  if (total === 0) return [];

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);
}

function analyzeDependencies(keyFiles: Record<string, string>): RepoAnalysis['dependencies'] {
  const deps: RepoAnalysis['dependencies'] = [];

  const packageJson = findKeyFile(keyFiles, 'package.json');
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson);
      if (parsed.dependencies) {
        for (const [name, version] of Object.entries(parsed.dependencies)) {
          deps.push({ name, version: String(version), type: 'runtime' });
        }
      }
      if (parsed.devDependencies) {
        for (const [name, version] of Object.entries(parsed.devDependencies)) {
          deps.push({ name, version: String(version), type: 'dev' });
        }
      }
    } catch { /* non-fatal */ }
  }

  const requirementsTxt = findKeyFile(keyFiles, 'requirements.txt');
  if (requirementsTxt) {
    const lines = requirementsTxt.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)([=<>!~]+(.+))?$/);
      if (match) {
        deps.push({ name: match[1], version: match[3] || '*', type: 'runtime' });
      }
    }
  }

  const goMod = findKeyFile(keyFiles, 'go.mod');
  if (goMod) {
    const lines = goMod.split('\n');
    let inRequire = false;
    for (const line of lines) {
      if (line.trim() === 'require (') { inRequire = true; continue; }
      if (line.trim() === ')') { inRequire = false; continue; }
      if (inRequire) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          deps.push({ name: parts[0], version: parts[1], type: 'runtime' });
        }
      }
    }
  }

  const cargoToml = findKeyFile(keyFiles, 'Cargo.toml');
  if (cargoToml) {
    const depSection = cargoToml.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
    if (depSection) {
      const lines = depSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w[\w-]*)\s*=\s*"([^"]+)"/);
        if (match) {
          deps.push({ name: match[1], version: match[2], type: 'runtime' });
        }
      }
    }
  }

  return deps;
}

function detectFrameworks(dependencies: RepoAnalysis['dependencies']): string[] {
  const frameworks: Set<string> = new Set();

  for (const dep of dependencies) {
    const framework = FRAMEWORK_DETECTION[dep.name];
    if (framework) frameworks.add(framework);
  }

  return Array.from(frameworks);
}

function detectTestFramework(dependencies: RepoAnalysis['dependencies']): string | null {
  for (const dep of dependencies) {
    const testFw = TEST_FRAMEWORK_DETECTION[dep.name];
    if (testFw) return testFw;
  }
  return null;
}

function detectBuildTool(dependencies: RepoAnalysis['dependencies'], keyFiles: Record<string, string>): string | null {
  for (const dep of dependencies) {
    const tool = BUILD_TOOL_DETECTION[dep.name];
    if (tool) return tool;
  }

  if (findKeyFile(keyFiles, 'webpack.config.js') || findKeyFile(keyFiles, 'webpack.config.ts')) {
    return 'webpack';
  }
  if (findKeyFile(keyFiles, 'vite.config.ts') || findKeyFile(keyFiles, 'vite.config.js')) {
    return 'Vite';
  }

  return null;
}

function detectCICD(fileTree: FileTreeEntry[], keyFiles: Record<string, string>): string | null {
  const hasGitHubActions = fileTree.some(f =>
    f.path.startsWith('.github/workflows/') && f.type === 'blob',
  );
  if (hasGitHubActions) return 'GitHub Actions';

  if (findKeyFile(keyFiles, '.gitlab-ci.yml')) return 'GitLab CI';
  if (fileTree.some(f => f.path === 'Jenkinsfile')) return 'Jenkins';
  if (fileTree.some(f => f.path === '.circleci/config.yml')) return 'CircleCI';
  if (fileTree.some(f => f.path === 'bitbucket-pipelines.yml')) return 'Bitbucket Pipelines';

  return null;
}

function detectPatterns(
  fileTree: FileTreeEntry[],
  keyFiles: Record<string, string>,
  dependencies: RepoAnalysis['dependencies'],
): string[] {
  const patterns: string[] = [];
  const paths = fileTree.map(f => f.path);

  const hasPackagesDir = paths.some(p => p.startsWith('packages/'));
  const hasTurboJson = !!findKeyFile(keyFiles, 'turbo.json');
  const hasLernaJson = !!findKeyFile(keyFiles, 'lerna.json');
  const hasNxJson = !!findKeyFile(keyFiles, 'nx.json');

  if (hasPackagesDir || hasTurboJson || hasLernaJson || hasNxJson) {
    patterns.push('Monorepo');
  }

  const hasServerDir = paths.some(p => p.startsWith('server/') || p.startsWith('api/') || p.startsWith('backend/'));
  const hasClientDir = paths.some(p => p.startsWith('src/') || p.startsWith('client/') || p.startsWith('frontend/') || p.startsWith('app/'));

  if (hasServerDir && hasClientDir) {
    patterns.push('Fullstack');
  }

  const hasExpress = dependencies.some(d => d.name === 'express');
  const hasFastify = dependencies.some(d => d.name === 'fastify');
  const hasHono = dependencies.some(d => d.name === 'hono');
  if (hasExpress || hasFastify || hasHono) {
    patterns.push('REST API');
  }

  const hasGraphQL = dependencies.some(d =>
    d.name === 'graphql' || d.name === '@apollo/server' || d.name === 'type-graphql',
  );
  if (hasGraphQL) patterns.push('GraphQL API');

  const hasTrpc = dependencies.some(d => d.name === '@trpc/server' || d.name === 'trpc');
  if (hasTrpc) patterns.push('tRPC');

  const hasSPA = dependencies.some(d =>
    d.name === 'react-router-dom' || d.name === 'vue-router' || d.name === '@angular/router',
  );
  if (hasSPA) patterns.push('SPA');

  const hasSSR = dependencies.some(d =>
    d.name === 'next' || d.name === 'nuxt' || d.name === '@sveltejs/kit' || d.name === 'astro',
  );
  if (hasSSR) patterns.push('SSR/SSG');

  const hasDocker = paths.some(p => p === 'Dockerfile' || p === 'docker-compose.yml' || p === 'docker-compose.yaml');
  if (hasDocker) patterns.push('Containerized');

  const packageJson = findKeyFile(keyFiles, 'package.json');
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson);
      const tsconfig = findKeyFile(keyFiles, 'tsconfig.json');
      if (parsed.devDependencies?.typescript || tsconfig) {
        let isStrict = false;
        if (tsconfig) {
          try {
            const tsParsed = JSON.parse(tsconfig);
            isStrict = tsParsed?.compilerOptions?.strict === true;
          } catch { /* non-fatal */ }
        }
        patterns.push(isStrict ? 'TypeScript strict' : 'TypeScript');
      }
    } catch { /* non-fatal */ }
  }

  const hasZustand = dependencies.some(d => d.name === 'zustand');
  const hasRedux = dependencies.some(d => d.name === '@reduxjs/toolkit' || d.name === 'redux');
  const hasMobx = dependencies.some(d => d.name === 'mobx');
  if (hasZustand) patterns.push('Zustand state management');
  else if (hasRedux) patterns.push('Redux state management');
  else if (hasMobx) patterns.push('MobX state management');

  return patterns;
}

function buildSummary(
  languages: RepoAnalysis['languages'],
  frameworks: string[],
  patterns: string[],
  commits: CommitEntry[],
): string {
  const parts: string[] = [];

  if (languages.length > 0) {
    const topLangs = languages.slice(0, 3).map(l => l.name).join(', ');
    parts.push(`Primarily ${topLangs}`);
  }

  if (frameworks.length > 0) {
    parts.push(`using ${frameworks.slice(0, 4).join(', ')}`);
  }

  if (patterns.length > 0) {
    parts.push(`with ${patterns.slice(0, 3).join(', ').toLowerCase()} architecture`);
  }

  let summary = parts.join(' ') + '.';

  if (commits.length > 0) {
    const uniqueAuthors = new Set(commits.map(c => c.author)).size;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentCommits = commits.filter(c => c.date > thirtyDaysAgo).length;
    summary += ` ${recentCommits} commits in the last 30 days by ${uniqueAuthors} contributor${uniqueAuthors !== 1 ? 's' : ''}.`;
  }

  return summary;
}

function getExtension(path: string): string | undefined {
  const basename = path.split('/').pop() || '';
  if (basename.toLowerCase() === 'dockerfile') return 'dockerfile';
  const parts = basename.split('.');
  if (parts.length < 2) return undefined;
  return parts.pop()!.toLowerCase();
}

function findKeyFile(keyFiles: Record<string, string>, filename: string): string | undefined {
  if (keyFiles[filename]) return keyFiles[filename];
  for (const [path, content] of Object.entries(keyFiles)) {
    if (path.endsWith(`/${filename}`) || path === filename) return content;
  }
  return undefined;
}
