import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import sherpa from 'sherpa-onnx-node';

const {values} = parseArgs({options: {
  model: {type: 'string', default: 'out/models/melo-en-v2'},
  plan: {type: 'string'},
}});
const storyboard = JSON.parse(await readFile(new URL('./water-cycle.json', import.meta.url), 'utf8'));
const script = JSON.parse(await readFile(values.plan ?? new URL('./water-cycle-script.json', import.meta.url), 'utf8'));
if (!Array.isArray(script) || script.length !== storyboard.scenes.length ||
    script.some(scene => !Array.isArray(scene) || scene.length !== 3 ||
      scene.some(phrase => typeof phrase !== 'string' || !phrase.trim()))) {
  throw new Error('The narration plan needs three spoken phrases for each water-cycle scene.');
}

const modelDir = resolve(values.model);
const tts = new sherpa.OfflineTts({model: {
  numThreads: 2,
  provider: 'cpu',
  vits: {
    model: join(modelDir, 'model.onnx'),
    tokens: join(modelDir, 'tokens.txt'),
    lexicon: join(modelDir, 'lexicon.txt'),
  },
}});
const mediaDir = resolve('out/media');
await mkdir(mediaDir, {recursive: true});
const revision = 'water-cycle-indian-english-v3';
const fps = 30;
const sampleRate = tts.sampleRate;
const pause = Math.round(0.24 * sampleRate);

const scenes = storyboard.scenes.map((scene, index) => {
  const phrases = script[index];
  const audio = phrases.map(text => {
    const {samples} = tts.generate({text, sid: 2, speed: 0.87});
    if (!samples.length) throw new Error(`The speech engine returned no audio for scene ${index + 1}.`);
    return samples;
  });
  const samples = new Float32Array(audio.reduce((total, phrase) => total + phrase.length, 0) + pause * (audio.length - 1));
  let offset = 0;
  const captions = audio.map((phrase, phraseIndex) => {
    const cue = {at: offset / sampleRate, text: phrases[phraseIndex]};
    samples.set(phrase, offset);
    offset += phrase.length + pause;
    return cue;
  });
  const audioSrc = `${revision}-${index + 1}.wav`;
  sherpa.writeWave(join(mediaDir, audioSrc), {samples, sampleRate});
  return {...scene, audioSrc, captions, reveal: captions[1].at,
    duration: Math.max(10, Math.ceil((samples.length / sampleRate + 0.55) * fps) / fps)};
});

const manifest = resolve('out', `${revision}.json`);
await writeFile(manifest, JSON.stringify({...storyboard, revision, scenes}, null, 2));
console.log(manifest);
