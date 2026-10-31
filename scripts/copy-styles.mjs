import { mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('src');
const output = path.resolve('dist');

async function copyScssFiles(from, to) {
  const entries = await readdir(from, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(from, entry.name);
    const outputPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      await copyScssFiles(sourcePath, outputPath);
      continue;
    }

    // the stylesheets, and the woff2 faces tokens/_phi-fonts.scss points at
    if (entry.isFile() && (entry.name.endsWith('.scss') || entry.name.endsWith('.scss.d.ts') || entry.name.endsWith('.woff2'))) {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await copyFile(sourcePath, outputPath);
    }
  }
}

await copyScssFiles(source, output);
