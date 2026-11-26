import {readFile, writeFile} from 'node:fs/promises';
import {basename, dirname, join} from 'node:path';
import {parseArgs} from 'node:util';

const {values} = parseArgs({options: {
  storyboard: {type: 'string'},
  scene: {type: 'string'},
  title: {type: 'string'},
  'droplet-closeup': {type: 'boolean'},
}});
if (!values.storyboard) throw new Error('Provide --storyboard with a saved manifest.');
const original = JSON.parse(await readFile(values.storyboard, 'utf8'));
const index = Number(values.scene) - 1;
if (!Number.isInteger(index) || !original.scenes[index]) throw new Error('Choose an existing scene number starting at 1.');
const revised = structuredClone(original);
const scene = revised.scenes[index];
if (values.title?.trim()) scene.title = values.title.trim();
if (values['droplet-closeup']) {
  if (scene.active !== 'condensation') throw new Error('The droplet close-up is available for condensation scenes.');
  scene.dropletCloseup = true;
}
if (JSON.stringify(scene) === JSON.stringify(original.scenes[index])) throw new Error('Select a visual or title change.');
revised.parentRevision = original.revision;
for (let version = 1; ; version++) {
  revised.revision = basename(values.storyboard, '.json') + '-edit-' + version;
  const path = join(dirname(values.storyboard), revised.revision + '.json');
  try {
    await writeFile(path, JSON.stringify(revised, null, 2), {flag: 'wx'});
    console.log(path);
    break;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}
