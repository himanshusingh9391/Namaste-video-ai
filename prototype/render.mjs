import {mkdir, readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const {values} = parseArgs({
  options: {
    storyboard: {type: 'string'},
    output: {type: 'string'},
    'preview-frame': {type: 'string'},
    browser: {type: 'string'},
    'check-only': {type: 'boolean'},
  },
});

const root = fileURLToPath(new URL('.', import.meta.url));
const storyboard = JSON.parse(await readFile(values.storyboard ?? resolve(root, 'water-cycle.json'), 'utf8'));
const validStages = new Set(['cycle', 'evaporation', 'condensation', 'precipitation', 'collection']);
if (!storyboard?.id || !storyboard.revision || !storyboard.title || !Array.isArray(storyboard.scenes)) {
  throw new Error('A storyboard needs an ID, revision, title and scenes.');
}

const durationInFrames = storyboard.scenes.reduce((frames, scene, index) => {
  if (!scene?.title || !validStages.has(scene.active) || !Number.isFinite(scene.duration) || scene.duration <= 0) {
    throw new Error(`Scene ${index + 1} needs a title, supported diagram stage and positive duration.`);
  }
  if (!Number.isFinite(scene.reveal) || scene.reveal < 0 || scene.reveal >= scene.duration) {
    throw new Error(`Scene ${index + 1} has an animation cue outside its duration.`);
  }
  if (!Array.isArray(scene.captions) || scene.captions[0]?.at !== 0) {
    throw new Error(`Scene ${index + 1} needs a caption at its start.`);
  }
  let lastCue = -1;
  for (const caption of scene.captions) {
    if (!Number.isFinite(caption.at) || caption.at <= lastCue || caption.at >= scene.duration ||
        typeof caption.text !== 'string' || !caption.text.trim()) {
      throw new Error(`Scene ${index + 1} needs nonempty captions with increasing times within the scene.`);
    }
    lastCue = caption.at;
  }
  const sceneFrames = Math.round(scene.duration * 30);
  if (sceneFrames < 1) throw new Error(`Scene ${index + 1} is shorter than one frame.`);
  return frames + sceneFrames;
}, 0);

if (durationInFrames < 60 * 30 || durationInFrames > 90 * 30) {
  throw new Error('The composition must run for 60–90 seconds.');
}

console.log(`${storyboard.revision}: ${storyboard.scenes.length} scenes, ${durationInFrames / 30} seconds`);
if (!values['check-only']) {
  const [{bundle}, {renderMedia, renderStill, selectComposition}] = await Promise.all([
    import('@remotion/bundler'),
    import('@remotion/renderer'),
  ]);
  const frame = values['preview-frame'] === undefined ? undefined : Number(values['preview-frame']);
  if (frame !== undefined && (!Number.isInteger(frame) || frame < 0 || frame >= durationInFrames)) {
    throw new Error('Preview frame must be within the composition.');
  }
  const output = resolve(values.output ?? `out/${storyboard.revision}.${frame === undefined ? 'mp4' : 'png'}`);
  await mkdir(dirname(output), {recursive: true});
  const publicDir = resolve(root, '../out/media');
  await mkdir(publicDir, {recursive: true});
  const serveUrl = await bundle({entryPoint: resolve(root, 'index.tsx'), publicDir});
  const inputProps = {storyboard};
  const browserExecutable = values.browser ?? null;
  const composition = await selectComposition({serveUrl, id: 'NamasteWaterCycle', inputProps, browserExecutable});
  if (frame === undefined) {
    let lastProgress = -10;
    await renderMedia({
      serveUrl, composition, inputProps, browserExecutable, codec: 'h264', outputLocation: output,
      concurrency: 3,
      onProgress: ({progress}) => {
        const percent = Math.floor(progress * 100);
        if (percent >= lastProgress + 10 || percent === 100 && lastProgress !== 100) {
          lastProgress = percent;
          console.log(`Render ${percent}%`);
        }
      },
    });
  } else {
    await renderStill({serveUrl, composition, inputProps, browserExecutable, frame, output});
  }
  console.log(output);
}
