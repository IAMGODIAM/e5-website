import { cp, mkdir, rm } from 'node:fs/promises';

const source = 'public';
const output = 'dist';

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true, force: true });
console.log(`[static-build] copied ${source}/ to ${output}/`);
