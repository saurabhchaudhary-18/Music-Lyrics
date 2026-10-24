#!/usr/bin/env node
/**
 * Converts an .lrc timed-lyrics file into src/data/lyricsData.json.
 *
 * Usage:  npm run lyrics:from-lrc -- path/to/song.lrc
 *
 * Only convert .lrc files you are licensed to use, and check the timestamps
 * against the exact audio file you ship (different edits/masters drift).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run lyrics:from-lrc -- path/to/song.lrc');
  process.exit(1);
}

const TIMESTAMP = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

const lines = [];
for (const raw of readFileSync(resolve(input), 'utf8').split(/\r?\n/)) {
  const stamps = [...raw.matchAll(TIMESTAMP)];
  if (stamps.length === 0) continue; // metadata tags like [ar:...] or blank lines

  const text = raw.replace(TIMESTAMP, '').trim();
  if (!text) continue;

  for (const [, min, sec, frac = '0'] of stamps) {
    const fraction = Number(`0.${frac}`);
    const time = Number(min) * 60 + Number(sec) + fraction;
    lines.push({ time: Math.round(time * 1000) / 1000, text });
  }
}

lines.sort((a, b) => a.time - b.time);

const target = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/lyricsData.json');
writeFileSync(target, `${JSON.stringify(lines, null, 2)}\n`);
console.log(`Wrote ${lines.length} timed lines to ${target}`);
