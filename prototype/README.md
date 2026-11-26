# Local water cycle prototype

The sample storyboard uses six scenes and a 72-second timeline. It renders a vertical explainer with an animated landscape. Follow vapour rising from the ocean, droplets forming near a cloud, rainfall over the mountains, and runoff returning to the ocean. The bundled storyboard has manually timed captions and renders silently.

## Run

Use Node.js 22 and run the commands from the repository root.

```powershell
npm install
node prototype/render.mjs --check-only
node prototype/render.mjs --preview-frame 570
node prototype/render.mjs
```

The default render writes `out/water-cycle-v1.mp4`. Use `--output out/water-cycle-motion-v2.mp4` to keep an earlier export. Use `--browser` with the path to an installed Chrome executable if the machine cannot download Remotion's browser. Use `--storyboard path/to/draft.json` for a revised manifest. Scene durations, caption cues and animation reveal times are in seconds.

## Review a visual revision

Run this command to add a magnified droplet to the condensation scene.

```powershell
node prototype/revise-scene.mjs --storyboard out/water-cycle-daniel-v2.json --scene 3 --droplet-closeup
```

Pass the printed revision path to `prototype/render.mjs --storyboard` for a new MP4. Each revision retains its parent reference and existing audio and caption cues. Use `--title "New scene title"` to revise a scene heading.

## Free offline narration

Download `model.onnx`, `lexicon.txt` and `tokens.txt` from the [MeloTTS English v2 ONNX export](https://huggingface.co/MiaoMint/MeloTTS-ONNX/tree/main/onnx_exports/en_v2) into `out/models/melo-en-v2`. The local script uses the model's Indian-English speaker and timestamps captions from the duration of each generated phrase.

```powershell
node prototype/narrate-local.mjs
node prototype/render.mjs --storyboard out/water-cycle-indian-english-v3.json
```

The MP4 is written to `out/water-cycle-indian-english-v3.mp4`. The narration and rendering steps run locally without provider credentials.

## Live provider configuration

Copy `.env.example` to a private `.env.local` and set the Gemini API key, the ElevenLabs API key, and the IDs for **Viraj – Confident and Natural** and **Monika Sogam – Interactive and Modern**. The repository ignores local environment files.

```powershell
node --env-file=.env.local prototype/generate.mjs --plan-only
# Review out/water-cycle-plan.json before requesting narration.
node --env-file=.env.local prototype/generate.mjs --plan out/water-cycle-plan.json --voice monika
node prototype/render.mjs --storyboard out/water-cycle-monika-v2.json
```

To try Viraj, pass `--voice viraj` and render `out/water-cycle-viraj-v2.json`. If Gemini is unavailable, review and use `prototype/water-cycle-script.json` as the input plan. ElevenLabs must allow the selected voice on the account. The narration step uses measured PCM duration and text alignment to calculate the timeline, caption timing and scene cues. An unchanged scene reuses its cached audio for the same voice.

To reproduce the Daniel animation using the reviewed water-cycle script, run these commands with an ElevenLabs key that has access to Daniel. [ElevenLabs default voice availability](https://elevenlabs.io/docs/help-center/product/voices/my-voices/what-are-default-voices)

```powershell
node --env-file=.env.local prototype/generate.mjs --plan prototype/water-cycle-script.json --voice daniel
node prototype/render.mjs --storyboard out/water-cycle-daniel-v2.json --output out/water-cycle-daniel-animated.mp4
```

Use [the pipeline checklist](../ARCHITECTURE.md) to review visual clarity, pacing, captions and scene revisions. Voice quality and alignment are evaluated after narration is connected.
