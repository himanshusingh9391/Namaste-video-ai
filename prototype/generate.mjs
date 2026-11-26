import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';

const {values} = parseArgs({options: {
  voice: {type: 'string', default: 'monika'},
  'plan-only': {type: 'boolean'},
  model: {type: 'string', default: 'gemini-3.8-flash'},
  plan: {type: 'string'},
}});
const {GEMINI_API_KEY, ELEVENLABS_API_KEY} = process.env;
const voices = {
  monika: process.env.ELEVENLABS_INDIAN_ENGLISH_FEMALE_VOICE_ID,
  viraj: process.env.ELEVENLABS_INDIAN_ENGLISH_MALE_VOICE_ID,
  daniel: 'onwK4e9ZLuTAKqWW03F9',
};
if (!Object.hasOwn(voices, values.voice)) throw new Error('Choose --voice monika, --voice viraj or --voice daniel.');
if (!values.plan && !GEMINI_API_KEY) throw new Error('Set GEMINI_API_KEY in .env.local.');
if (!values['plan-only'] && (!ELEVENLABS_API_KEY || !voices[values.voice])) {
  throw new Error('Set the ElevenLabs key and selected voice ID in .env.local.');
}
const fixture = JSON.parse(await readFile(new URL('./water-cycle.json', import.meta.url), 'utf8'));
const output = resolve('out');
const media = resolve(output, 'media');
await mkdir(media, {recursive: true});

async function request(url, headers, body, service) {
  const response = await fetch(url, {
    method: 'POST', headers: {...headers, 'Content-Type': 'application/json'}, body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  const payload = await response.json();
  if (!response.ok) {
    const status = payload.error?.status ?? payload.detail?.status ?? 'request_failed';
    throw new Error(`${service} returned HTTP ${response.status} (${status}).`);
  }
  return payload;
}

async function plan() {
  const response = await request(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(values.model)}:generateContent`,
    {'x-goog-api-key': GEMINI_API_KEY},
    {
      contents: [{parts: [{text: [
        'Write a 150–165 word English voiceover explaining the water cycle for Indian viewers age 12 and above.',
        'Use exactly six scenes in this order: cycle introduction, evaporation, condensation, precipitation, collection and runoff, cycle recap.',
        'Follow the facts below. Make each sentence short and conversational. Keep each scene around 24–29 words.',
        'Return each scene as three short narration phrases that can also be captions, at most 11 words per phrase. Put the action that drives the main animation in phrase two.',
        fixture.scenes.map(scene => scene.captions.map(caption => caption.text).join(' ')).join('\n'),
      ].join('\n')}]}],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'array', minItems: 6, maxItems: 6,
          items: {type: 'array', minItems: 3, maxItems: 3, items: {type: 'string'}},
        },
      },
    },
    'Gemini',
  );
  const result = response.candidates?.[0]?.content?.parts?.find(part => part.text && !part.thought)?.text;
  if (!result) throw new Error('Gemini returned no storyboard.');
  return JSON.parse(result);
}

const lines = values.plan ? JSON.parse(await readFile(values.plan, 'utf8')) : await plan();
if (!Array.isArray(lines) || lines.length !== fixture.scenes.length ||
    lines.some(scene => !Array.isArray(scene) || scene.length !== 3 || scene.some(line => typeof line !== 'string' || !line.trim() || line.trim().length > 90))) {
  throw new Error('Expected six scenes with three short caption phrases each.');
}
const script = lines.map(scene => scene.map(line => line.trim()));
if (!values.plan) {
  await writeFile(resolve(output, 'water-cycle-plan.json'), JSON.stringify(script, null, 2));
  console.log('Saved the Gemini storyboard to out/water-cycle-plan.json');
}

const sampleRate = 24000;
function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function narrate(phrases) {
  const text = phrases.join(' ');
  const voiceId = voices[values.voice];
  const model = 'eleven_multilingual_v2';
  const hash = createHash('sha256').update(JSON.stringify([voiceId, model, text])).digest('hex').slice(0, 20);
  const audioSrc = `speech-${hash}.wav`;
  const timingPath = resolve(output, `speech-${hash}.json`);
  try {
    await readFile(resolve(media, audioSrc));
    return {audioSrc, ...JSON.parse(await readFile(timingPath, 'utf8'))};
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const audio = await request(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=pcm_24000`,
    {'xi-api-key': ELEVENLABS_API_KEY},
    {text, model_id: model, language_code: 'en', voice_settings: {stability: 0.56, similarity_boost: 0.75}},
    'ElevenLabs',
  );
  const pcm = Buffer.from(audio.audio_base64 ?? '', 'base64');
  const alignment = audio.alignment;
  const starts = alignment?.character_start_times_seconds;
  if (!pcm.length || pcm.length % 2 || alignment?.characters?.join('') !== text || !starts || starts.length !== text.length) {
    throw new Error('ElevenLabs returned audio or alignment that could not be matched to the approved script.');
  }
  let offset = 0;
  const captions = phrases.map((phrase, index) => {
    const at = index === 0 ? 0 : starts[offset];
    offset += phrase.length + 1;
    return {at, text: phrase};
  });
  const timing = {captions, reveal: captions[1].at, duration: Math.max(10, Math.ceil((pcm.length / (sampleRate * 2) + 0.6) * 30) / 30)};
  await writeFile(resolve(media, audioSrc), wav(pcm));
  await writeFile(timingPath, JSON.stringify(timing));
  return {audioSrc, ...timing};
}

if (!values['plan-only']) {
  const scenes = [];
  for (const [index, scene] of fixture.scenes.entries()) {
    const speech = await narrate(script[index]);
    scenes.push({...scene, ...speech});
    console.log(`Prepared ${scene.title}, ${speech.duration.toFixed(2)} seconds`);
  }
  const revision = `water-cycle-${values.voice}-v2`;
  const manifest = resolve(output, `${revision}.json`);
  await writeFile(manifest, JSON.stringify({...fixture, revision, scenes}, null, 2));
  console.log(manifest);
}
