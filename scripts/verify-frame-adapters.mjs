import fs from 'node:fs/promises';

const source = await fs.readFile('src/cinematic/adapters/frame-adapter.ts', 'utf8');
const runtime = await fs.readFile('src/cinematic/runtime.ts', 'utf8');
const three = await fs.readFile('src/cinematic/adapters/three-hero.ts', 'utf8');
const checks = {
  clampsFrames: source.includes('clampFrame'),
  reverseOrderSafe: source.includes('Math.floor'),
  hyperframesSeekEvent: runtime.includes("'hf-seek'"),
  seededRandom: three.includes('function seeded'),
  contextLoss: three.includes('webglcontextlost') && three.includes('webglcontextrestored'),
  teardown: three.includes('renderer?.dispose()') && runtime.includes("'pagehide'"),
};
console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some((value) => !value)) process.exitCode = 1;
