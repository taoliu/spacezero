import { defineConfig } from 'vite';

const normalizeBase = (value: string): string => {
  if (!value.startsWith('/')) {
    value = `/${value}`;
  }
  if (!value.endsWith('/')) {
    value = `${value}/`;
  }
  return value;
};

const resolveBase = (mode: string): string => {
  if (mode === 'development') {
    return '/';
  }

  if (process.env.BASE_PATH) {
    return normalizeBase(process.env.BASE_PATH);
  }

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (repo) {
    return normalizeBase(repo);
  }

  return '/';
};

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    target: 'es2019',
  },
}));
