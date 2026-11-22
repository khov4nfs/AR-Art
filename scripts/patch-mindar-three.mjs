/**
 * MindAR 1.2.5 ships a Three integration built against legacy color-space APIs.
 * The EVERIE 3D configurator requires modern Three.js, so adapt only the two
 * legacy calls in MindAR's pinned distribution at install time.
 * Fail closed if the upstream distribution changes; never silently rewrite it.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const mindarPackage = JSON.parse(await readFile(resolve('node_modules/mind-ar/package.json'), 'utf8'));
if (mindarPackage.version !== '1.2.5') {
  throw new Error(`Unsupported mind-ar version ${mindarPackage.version}; review Three.js adapter.`);
}

const file = resolve('node_modules/mind-ar/dist/mindar-image-three.prod.js');
const content = await readFile(file, 'utf8');
const oldColorImport = 'sRGBEncoding as Si';
const currentColorImport = 'SRGBColorSpace as Si';
const oldSetter = 'this.renderer.outputEncoding = Si';
const currentSetter = 'this.renderer.outputColorSpace = Si';

if (content.includes(currentColorImport) && content.includes(currentSetter)) {
  console.log('MindAR/Three.js compatibility adapter already applied.');
} else if (content.includes(oldColorImport) && content.includes(oldSetter)) {
  const adapted = content.replace(oldColorImport, currentColorImport).replace(oldSetter, currentSetter);
  if (adapted === content) throw new Error('MindAR Three.js adapter did not match the expected upstream bundle.');
  await writeFile(file, adapted);
  console.log('Adapted MindAR 1.2.5 color-space API for EVERIE Three.js.');
} else {
  throw new Error('MindAR bundle is not recognized; refusing to patch an unexpected upstream release.');
}
