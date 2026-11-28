# Namaste Video project status

This is the development ledger for the invite-only pilot. Update the relevant row whenever code changes. A feature is complete only after its normal entry point works and the verification column records how it was checked. Stitch screens describe design intent. Prototype output proves only the local example it exercised.

## Feature delivery order

The following sequence follows the F00–F22 backlog. Status reflects this checkout. The earlier pilot milestones and their evidence are preserved below.

| Slice | Feature | Current evidence or next check |
|---|---|---|
| F00 | Local idea-to-video proof of concept | Local narrated water-cycle prototype and revised export recorded below. |
| F01 | Next.js workspace, shared styles and navigation | Implemented and previously checked on desktop and mobile. |
| F02 | MongoDB adapter, collection validation and initial indexes | Existing authentication adapter plus workspace schema setup. Verified locally below. |
| F03 | Account admission and sessions | Authenticated feature verified against an isolated Atlas database. Only active invitations admit users. Revoked, unlisted and public signup checks passed. |
| F04 | Sign-in, recovery and private routes | Password setup, sign-in, expiry, six anonymous redirects and sign-out verified against the production build. Email delivery still requires a verified sender. |
| F05 | Personal project create, list, rename and delete APIs | Authenticated API verified against an isolated Atlas database. GET/POST /api/projects and GET/PATCH/DELETE /api/projects/:id passed two-owner isolation, pagination, validation, stale revision, soft deletion and idempotent creation checks. Production build passed. |
| F06 | My videos library | Authenticated /videos library verified with isolated Atlas data and headless Edge. Mobile create/rename/delete dialogs, stage and empty filters, desktop 12-to-13 pagination, failed-list retry and production build passed. |
| F07 | Idea draft persistence, autosave and conflicts | Authenticated draft editor implemented in /videos → Edit idea. Topic, notes and voice persist with version checks. Two-owner API checks, stale edits, invalid input, browser reload, failed-save retention and retry passed. |
| F08 | Idea and brainstorming UI | Basic notebook exists. Gemini suggestions and draft integration remain. |
| F09 | Storyboard generation backend | Planned. Validate generated scenes and recover from provider failures. |
| F10 | Combined storyboard and script review | Design only. Implement scene editing and narration review. |
| F11 | Conversational revisions and approval | Planned. Bind approval to an exact revision. |
| F12 | Private Cloudinary asset adapter and media access | Planned. Verify authenticated upload and read, owner-only access, expiring delivery and missing-asset handling in the existing Cloudinary account. |
| F13 | Durable generation jobs | Planned. Verify retry, cancellation and duplicate delivery. |
| F14 | Hosted rendering | Local water-cycle prototype exists. Hosted rendering remains. |
| F15 | Video review, approval and download | Planned. Play real media, select and approve an exact version, and export it. |
| F16 | Caption and video revisions | Planned. Rerender caption edits, route spoken changes to storyboard review and retain previous output. |
| F17 | Personal preferences | Planned. Persist timezone and future-project voice without changing existing projects. |
| F18 | Personal Instagram authorization | Planned. Verify callback, eligibility, reconnect, disconnect and owner isolation. |
| F19 | Reviewed Post now flow | Planned. Confirm the exact asset, account and caption. Handle duplicates and uncertain outcomes. |
| F20 | Scheduling and schedule management | Planned. Check timezone, DST, lead time, durable dispatch and cancel/replace/reconnect races. |
| F21 | Cinema homepage and cross-device polish | Planned. Verify hero motion, mobile layout, accessibility and real example playback. |
| F22 | Internal acceptance and deployment | Planned. Verify two-user isolation, outage recovery, generation benchmarks and Meta test posts. Review deployment separately. |

### F02 verification · 28 November 2026

Run `npm run db:setup` with MONGODB_URI set to the intended database. The command installs validators and indexes on pilotInvites, preferences and projects. On an isolated MongoDB 7 instance, setup passed twice, all three collections rejected missing required fields, duplicate preference owners were rejected and the owner-scoped project pagination index matched the design. Existing Atlas data was untouched. Apply setup before enabling persistent projects in a hosted deployment.

## Earlier pilot milestones


| Slice | Feature and completion condition | Status | Evidence or outstanding work |
|---|---|---|---|
| 01 | Run the Next.js workspace and navigate each destination on desktop, tablet and phone. | Complete | Production build, type check and browser navigation checks passed on 26 November 2026. |
| 02 | Admit approved Google accounts, create individual workspaces, sign out and return to the original route. | Ready for pilot test | Google OAuth, Atlas admission and protected workspace routes implemented. Live Google consent and authenticated sign-out await the tester. |
| 02b | Sign in with a chosen password and return to the same private workspace. | Ready for local pilot test | Production build and isolated Atlas round trip passed. See the password pilot entry below. |
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
- Billing remains outside the pilot. Public email onboarding and AI brainstorming are now included in the delivery order above.

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

The dev branch starts at scaffold commit be1f4a5. Develop and verify milestones on dev. Promote a finalized release to main through a pull request after user approval.

## 28 November 2026 · Authentication pilot

Open http://localhost:3000/sign-in on the development computer. Continue with the invited Google account, open Overview, then choose Sign out in the sidebar or compact Menu. Reopen /dashboard to verify that sign-in is required again. The app uses verified Google email, an active Atlas invitation and a Better Auth session. Local notes use separate browser keys per owner.

Verified the production build, Atlas ping and pilot invitation, sign-in page, redirects from all six private routes, Google authorization URL and registered callback, and the sign-out endpoint with an anonymous browser session. Live account consent, signed-in dashboard viewing and session invalidation await the tester. To start locally use npm run dev. Configure the server values listed in .env.example in .env.local and manage pilot membership with npm run invite -- grant or revoke followed by the email address.

## 28 November 2026 · Email and password pilot

Open http://localhost:3000/sign-in. An invited Google user can open Overview, choose **Add an email sign-in password**, and save a password of 12–128 characters. Sign out and sign in with the same email and chosen password to return to the same workspace. Opening a private link before sign-in returns the creator to that allowed destination. A direct sign-in opens Overview.

For setup without Google, the pilot administrator runs `npm run password-link -- email@example.com` from the configured checkout for an active invitation. Deliver the printed single-use link privately to the verified owner of the invited email. It expires after 15 minutes and also works for password recovery. Opening it lets the creator choose their password. Completing this flow invalidates earlier sessions. The production app uses Better Auth and the MongoDB adapter for password hashes and sessions. Google credentials are optional for email sign-in.

Verified the production build and TypeScript checks. Exercised setup, single-use token consumption, successful email sign-in, incorrect password rejection, dashboard access, the authenticated sign-in redirect and sign-out invalidation against an isolated temporary Atlas database. Verified the updated sign-in page on localhost:3000. The real creator's Google-to-password setup and interactive browser walkthrough remain for pilot review. Hosting remains pending.

## Public email onboarding · F03–F04

At /sign-in, choose **Create an account with email**. The server sends a single-use, 15-minute verification link through Resend. Confirming it establishes a verified Better Auth session. New accounts choose a password and return to sign-in. Existing password accounts open their dashboard. Workspace access and browser draft keys continue to use the authenticated owner. Explicitly revoked pilot accounts remain blocked.

Configure RESEND_API_KEY and AUTH_EMAIL_FROM (a verified sender) in the server environment and restart. Set BETTER_AUTH_URL to the public HTTPS origin when deploying so recipients can open their links. The production build, including TypeScript and the new routes, passed. Real message delivery and a two-inbox registration walkthrough remain unverified because this checkout has no configured sending credentials. Hosted integration remains pending.

## Approved-user admission and recovery checks

Use npm run invite to provision access and /sign-in to enter. scripts/check-admission.mjs exercises the production server with an isolated test database. Verified successful password setup, token replay rejection, incorrect password, disabled accounts, expired session, logout, six private routes and inaccessible source media. The app production build and prototype TypeScript check passed. PROTOTYPE_STATUS.md records the three existing local exports. The 23-test suite referenced by the supplied baseline has not been identified in this checkout.

## 28 November 2026 · Local videos route recovery

The production server already running on port 3000 returned 404 for /videos while the current build manifest contained the route. Restarted that server against the current build. Verified /videos returns 307 to /sign-in?next=%2Fvideos for an anonymous visitor and /sign-in returns 200. Entry point is http://localhost:3000/videos. Restart npm run start after a production rebuild so the running process loads the new routes.

## F07 · Persisted idea drafts

Open My videos and expand Edit idea on a project. Edits save after a short pause. Failed saves preserve the current input, and stale versions require reviewing the saved draft. Existing project records use their title as the initial topic. Verified the production build and isolated Atlas API checks for ownership, persistence, invalid input and revision conflicts. Headless Edge checks covered mobile editing, reload persistence, retained input after a simulated 503, retry and the existing library controls. Voice selection previews and Gemini brainstorming remain F08.
