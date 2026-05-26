#!/usr/bin/env node

import { copyFile, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noBackup = args.includes('--no-backup');
const authDirArg = args.find((arg) => !arg.startsWith('--'));

if (!authDirArg) {
  console.error('Usage: node enable-auth-websockets.mjs <auth-dir> [--dry-run] [--no-backup]');
  process.exit(1);
}

const authDir = resolve(authDirArg);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function updateJson(filePath) {
  let raw;

  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    return { filePath, status: 'read_failed', reason: error.message };
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return { filePath, status: 'skipped', reason: 'invalid_json' };
  }

  if (!data || Array.isArray(data) || typeof data !== 'object') {
    return { filePath, status: 'skipped', reason: 'json_root_not_object' };
  }

  if (data.websockets === true) {
    return { filePath, status: 'unchanged' };
  }

  data.websockets = true;

  if (dryRun) {
    return { filePath, status: 'would_update' };
  }

  if (!noBackup) {
    await copyFile(filePath, `${filePath}.bak-${stamp}`);
  }

  const tmpPath = join(dirname(filePath), `.enable-auth-websockets-${process.pid}-${Math.random().toString(16).slice(2)}.tmp`);
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tmpPath, filePath);

  return { filePath, status: 'updated' };
}

const files = await walk(authDir);
const results = [];

for (const filePath of files) {
  results.push(await updateJson(filePath));
}

const summary = results.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] || 0) + 1;
  return acc;
}, {});

for (const item of results) {
  const suffix = item.reason ? ` (${item.reason})` : '';
  console.log(`${item.status}: ${item.filePath}${suffix}`);
}

console.log('summary:', JSON.stringify(summary));
