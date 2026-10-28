/**
 * Generates public/startup.mp3 — the placeholder boot chime.
 *
 * The sound is synthesised here rather than downloaded, so the repo ships no
 * third-party audio of any kind. Run `node scripts/make-chime.mjs` (ffmpeg must be
 * on PATH) to regenerate it, or drop your own short mono file at that path: the
 * brief asks for under ~40 KB, and 3 seconds or less is plenty.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SAMPLE_RATE = 22050;
const DURATION = 2.4;
const OUT = join(import.meta.dirname, '..', 'public', 'startup.mp3');

// A rising C major arpeggio with a long tail: friendly, retro, and entirely ours.
const NOTES = [
  { hz: 523.25, at: 0.0, amp: 0.30, decay: 4.0 },
  { hz: 659.25, at: 0.16, amp: 0.30, decay: 4.0 },
  { hz: 783.99, at: 0.32, amp: 0.34, decay: 2.2 },
  { hz: 1046.5, at: 0.48, amp: 0.16, decay: 1.6 },
];

function sample(t) {
  let value = 0;

  for (const note of NOTES) {
    if (t < note.at) continue;
    const age = t - note.at;
    const attack = Math.min(1, age / 0.006); // 6 ms ramp, so there is no click
    const envelope = attack * Math.exp(-note.decay * age);
    // Fundamental plus a quiet octave: a bell-ish timbre from two sines.
    const wave = Math.sin(2 * Math.PI * note.hz * age) + 0.25 * Math.sin(2 * Math.PI * note.hz * 2 * age);
    value += note.amp * envelope * wave;
  }

  const fadeOut = Math.min(1, (DURATION - t) / 0.12);
  return Math.max(-1, Math.min(1, value * Math.max(0, fadeOut)));
}

function wav(samples) {
  const bytes = Buffer.alloc(44 + samples.length * 2);

  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(36 + samples.length * 2, 4);
  bytes.write('WAVE', 8);
  bytes.write('fmt ', 12);
  bytes.writeUInt32LE(16, 16); // PCM chunk size
  bytes.writeUInt16LE(1, 20); // format: uncompressed
  bytes.writeUInt16LE(1, 22); // channels: mono
  bytes.writeUInt32LE(SAMPLE_RATE, 24);
  bytes.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  bytes.writeUInt16LE(2, 32); // block align
  bytes.writeUInt16LE(16, 34); // bits per sample
  bytes.write('data', 36);
  bytes.writeUInt32LE(samples.length * 2, 40);

  samples.forEach((value, index) => {
    bytes.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  });

  return bytes;
}

const count = Math.round(SAMPLE_RATE * DURATION);
const samples = new Float64Array(count);
for (let i = 0; i < count; i++) samples[i] = sample(i / SAMPLE_RATE);

const work = mkdtempSync(join(tmpdir(), 'diary-chime-'));
const source = join(work, 'chime.wav');

try {
  writeFileSync(source, wav(Array.from(samples)));
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', source,
    '-ac', '1',
    '-map_metadata', '-1',
    '-c:a', 'libmp3lame', '-b:a', '56k',
    OUT,
  ], { stdio: 'inherit' });
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`wrote ${OUT}`);
