// Synthesizes the game's sound effects as small WAV files (no third-party audio).
// Run with: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const outDir = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2),
  );
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(outDir, name), Buffer.concat([header, data]));
}

// Tone with a quick attack and exponential decay; freq can sweep start -> end.
function tone(seconds, f0, f1, volume, decay) {
  const n = Math.floor(seconds * RATE);
  const out = new Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = f0 + (f1 - f0) * t;
    phase += (2 * Math.PI * f) / RATE;
    const attack = Math.min(1, i / (RATE * 0.003));
    out[i] = Math.sin(phase) * Math.exp(-decay * t) * attack * volume;
  }
  return out;
}

function mix(...tracks) {
  const n = Math.max(...tracks.map((t) => t.length));
  const out = new Array(n).fill(0);
  tracks.forEach((t) => t.forEach((v, i) => (out[i] += v)));
  return out;
}

function offset(track, seconds) {
  return new Array(Math.floor(seconds * RATE)).fill(0).concat(track);
}

fs.mkdirSync(outDir, { recursive: true });

writeWav('click.wav', tone(0.06, 1100, 900, 0.5, 6));
writeWav('pick.wav', tone(0.07, 520, 760, 0.45, 4));
writeWav(
  'drop.wav',
  mix(tone(0.12, 260, 110, 0.7, 7), tone(0.04, 1400, 700, 0.25, 8)),
);

const notes = [523.25, 659.25, 783.99, 1046.5];
const win = notes.map((f, i) =>
  offset(
    mix(tone(0.5, f, f, 0.35, 4), tone(0.5, f * 2, f * 2, 0.1, 6)),
    i * 0.13,
  ),
);
writeWav('win.wav', mix(...win));
console.log('Sounds written to', outDir);
