import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export function discoverTests(directory, suffix = '.test.js') {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  // Do not follow symlinks or treat helper JavaScript files as tests.
  return entries
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return discoverTests(path, suffix);
      return entry.isFile() && entry.name.endsWith(suffix) ? [path] : [];
    })
    .sort();
}
