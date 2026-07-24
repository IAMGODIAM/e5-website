import { access, mkdir, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const source = path.resolve('assets/source-3d');
const output = path.resolve('public/assets/3d');

async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}

if (!(await exists(source))) {
  console.log('[asset-pipeline] No assets/source-3d directory; nothing to optimize.');
  process.exit(0);
}

await mkdir(output, { recursive: true });
const files = (await readdir(source)).filter((file) => /\.(gltf|glb)$/i.test(file));
if (!files.length) {
  console.log('[asset-pipeline] No glTF/GLB sources found.');
  process.exit(0);
}

for (const file of files) {
  const input = path.join(source, file);
  const target = path.join(output, file.replace(/\.gltf$/i, '.glb'));
  await run('npx', ['--yes', '@gltf-transform/cli', 'optimize', input, target, '--compress', 'meshopt', '--texture-compress', 'webp']);
  const before = (await stat(input)).size;
  const after = (await stat(target)).size;
  console.log(`[asset-pipeline] ${file}: ${before} -> ${after} bytes`);
}

console.log('[asset-pipeline] Geometry is Meshopt-compressed. Convert final GPU textures to KTX2 with toktx when source textures are approved; UASTC for normal/ORM, ETC1S for color/emissive.');
