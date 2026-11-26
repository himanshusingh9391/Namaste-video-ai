# Namaste Video project status

This is the development ledger for the invite-only pilot. Update the relevant row whenever code changes. A feature is complete only after its normal entry point works and the verification column records how it was checked. Stitch screens describe design intent. Prototype output proves only the local example it exercised.

## Feature delivery order

| Slice | Feature and completion condition | Status | Evidence or outstanding work |
|---|---|---|---|
| 01 | Run the Next.js workspace and navigate each destination on desktop, tablet and phone. | Complete | Production build, type check and browser navigation checks passed on 26 November 2026. |
| 02 | Admit approved Google accounts, create individual workspaces, sign out and return to the original route. | Planned next | Better Auth and Atlas. Test one allowed and one refused account. |
| 03 | Save projects and ideas per creator, list drafts, enforce ownership and resume the latest saved stage. | Planned | Replace browser-only notes with authenticated persistence. Check with two creators. |
| 04 | Generate a validated, timed storyboard from notes and ask one clarification when needed. | Planned | Gemini planning and recoverable validation. |
| 05 | Edit individual scenes, propose a conversational revision, compare, apply or discard and approve an exact revision. | Planned | Cover autosave failure and edit conflicts. |
| 06 | Preview and select narration voices, persist defaults and generate timestamped narration for approved scenes. | Prototype only | Daniel narration exists for the local water-cycle example. |
| 07 | Assemble motion graphics and captions, render and validate an immutable portrait MP4. | Prototype only | Remotion sample and revised local export exist. General-purpose scene selection and hosted rendering remain. |
| 08 | Run durable jobs, show progress and retry failed stages while retaining an earlier export. | Planned | Inngest, Vercel Sandbox and Cloudinary delivery. |
| 09 | Preview a finished version, correct captions, revise narration and download the private 1080p MP4. | Planned | Public demo playback is separate from private render access. |
| 10 | Connect, verify, reconnect and disconnect a creator's eligible Instagram account. | Planned | Meta OAuth, encrypted token and affected schedule handling. |
| 11 | Confirm and publish one exact video, caption and destination. | Planned | Verify provider status before retrying uncertain submissions. |
| 12 | Schedule, reschedule and cancel posts and show publication activity. | Planned | Verify time zone, schedule/version changes and missed dispatch. |
| 13 | Run hosted pilot acceptance. | Planned | Two isolated creators, full 90-second render, Safari keyboard/video and failed-provider recovery. |

## Design and prototype baseline

- Requirements and acceptance cases are in PRD.md. API_DESIGN.md, DATABASE_DESIGN.md and SYSTEM_DESIGN.md describe intended contracts.
- The Stitch review and its responsive QA cover design prototypes. Track application checks independently.
- The water-cycle narration, animation and revised scene were generated before application development. The workspace demo reuses that film.
- Keep billing and public onboarding outside the pilot. The idea notebook is a freeform starting point. AI brainstorming is a separate scope decision.

## Change history

### 2026-11-26 — first application slice

The first slice adds the Next.js App Router shell, a desktop sidebar and a tablet/phone menu. Overview links to the local sample film. Create video and Idea notebook store separate text on the current browser. These local drafts are intended for a single tester and do not provide creator isolation. Publishing, voice selection and Instagram authorization have explicit pending states. No provider credentials are required to try navigation.

## Slice 01 verification · 26 November 2026

- `npm run build` produced the root redirect and all six workspace destinations. `npm run typecheck` passed.
- Headless Chrome traversed every destination at widths of 320, 768, 1024 and 1440 CSS pixels. It checked headings, route changes, closed menus and horizontal overflow. At compact widths, Escape returned focus to the Menu button.
- Reloading the local brief restored its text. Returning to the idea notebook restored its separate note.
- Chrome loaded the bundled sample MP4 and measured 77.611 seconds. This validates sample media availability. Hosted generation, private media delivery and external publishing remain pending.
- Run locally with `npm install` and `npm run dev`. Open the loopback URL printed by Next.js. For a production preview, run `npm run build` followed by `npm start`.

## Individual Stitch screens

Each link opens a separate design. Together they are the visual reference for the remaining slices.

1. [Sign in](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=21bdfc8ebbad4155ab18ac0234ed4737)
2. [My projects](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=38665b49ea384c4c88ece390248dfc5c)
3. [New project](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=bbde5e91eab7433a826a3588f90a92b7)
4. [Storyboard](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=26cadd098212451791a9ee298f2c29b6)
5. [Review changes](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=13ff094261c14af1b31a9644893f8b1b)
6. [Generation progress](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=f208634f59df4cff8afbf789ed5d72f0)
7. [Video review](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=3be31201fe924afdb4524fd3c6f291e4)
8. [Publish a Reel](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=a7185227b36d4905b63029e85332cf0a)
9. [Publishing activity](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=a82931cb2dab4b9e9dbd1d5ee7b5b3e5)
10. [Voice preferences](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=08aaa901ae0d4e5d993231e52f0470f1)
11. [Instagram connection](https://stitch.withgoogle.com/projects/13633208416151897652?node-id=479cf31e038045fa987e404cc41bf247)

## Version control

The public repository is [Namaste-video-ai on GitHub](https://github.com/himanshusingh9391/Namaste-video-ai). The initial milestone includes the workspace scaffold, the local video prototype, design previews and project documents. Each subsequent completed step includes a status update, a scoped commit and a verified push.
