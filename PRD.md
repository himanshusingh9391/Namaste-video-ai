# Namaste Video

**Final V1 product requirements · Invite-only internal pilot**

**Product domain** · `namastevideo.ai` is the chosen domain. Registration and availability are unverified.

## 1. Product outcome

A creator brings a topic or teaching notes and leaves with a vertical, narrated motion-graphics explainer they would publish under their own name. The product chooses a duration from 60 through 90 seconds based on the explanation. The creator controls what the video teaches, can correct individual scenes, and decides when an exact finished version may go public.

Namaste Video is an AI video studio. The first release serves English-language educational explainers for Indian audiences, tested by the founder and invited teammates acting as individual creators. The product name also fits future formats such as news segments and memes. The pilot tests whether a creator can finish a video they would publish and come back with a second topic.

## 2. Release boundaries

| Included in V1 | Deferred |
|---|---|
| Individual creator workspaces, saved drafts, completed videos, topic or notes as input | Shared workspaces, shared Instagram destinations and multi-stage approval workflows |
| AI-selected length, editable combined script and storyboard, conversational revision | Open-ended idea brainstorming and a duration selector |
| Animated text, shapes, icons, illustrations and diagrams, synthetic narration, editable captions | Photorealistic footage generation, avatars, voice cloning, brand controls and a timeline editor |
| Vertical 1080 × 1920 MP4, Instagram publish now or schedule | Additional social platforms, recurring campaigns and social analytics |
| Internal metering, autosave, job progress and retries | Billing, subscriptions, credit balances and creator-facing cost management move to V2 |
| Educational motion-graphics explainers and one default visual style | News segments, memes, broader format presets and public onboarding |

Creators preview male and female Indian-English narration, save a dashboard default, and override it per project. The default visual style uses an off-white background, charcoal text, and one accent colour for emphasis. Each scene centres on a diagram, illustration or key idea. Place labels next to the objects they describe, reserve room for captions, and animate elements when the narration introduces them.

### Individual creator workspaces

Each invited person signs into an individual dashboard. Ideas, notes, voice preferences, drafts, renders, exports, schedules and Instagram connections belong to that creator. Projects are automatically private. The pilot admin manages admission. Enforce creator ownership on every read, edit, export and publish action, including direct media access and background jobs.

## 3. Creator journey and screens

### Pilot technology stack

| Layer | Choice and responsibility |
|---|---|
| Web app and backend | Next.js with TypeScript and a Node.js backend, hosted on Vercel. The dashboard submits jobs and displays their saved status. |
| Authentication | Better Auth with Google sign-in. Admit verified, admin-approved email addresses. Authorize each operation against the signed-in creator and their workspace. |
| Database | MongoDB Atlas stores application records including creator workspaces, projects, revisions, schedules and job status. Schema and index design are deferred. |
| Media storage | Cloudinary stores generated voice tracks and completed MP4s. Persist the uploaded asset reference before marking a render ready. |
| Background workflows | Inngest coordinates generation steps, retries and scheduled publishing. When a scheduled job wakes, recheck its current approval, destination, time and permissions before posting. |
| Animation and hosted rendering | Remotion defines and previews the scenes. An Inngest workflow starts a Vercel Sandbox to render the approved composition and deliver the MP4 to Cloudinary before the temporary sandbox is released. |
| External APIs | Start with Gemini `gemini-3.8-flash` for planning and revisions and ElevenLabs `eleven_multilingual_v2` for timestamped narration. Configure model and voice IDs server-side. Use Instagram Login and Meta’s publishing API for account authorization and Reels. |

The first hosted test must render a full 90-second explainer, upload it to Cloudinary, and play the resulting MP4 after the sandbox closes. [Remotion on Vercel](https://www.remotion.dev/docs/vercel) · [Better Auth MongoDB adapter](https://www.better-auth.com/docs/adapters/mongo) · [Inngest scheduled waits](https://www.inngest.com/docs/reference/functions/step-sleep-until)

### Screen flow

1. **Account → Dashboard.** Sign in with a verified Google account on the pilot allowlist. If the email is ineligible, explain how to switch accounts or contact the pilot admin. A first-time creator sees an empty personal dashboard with Create project and Connect Instagram. A returning creator sees project title, thumbnail when available, last edited time, generation status and publishing status. Selecting a project opens its latest saved stage. An expired session prompts sign-in and returns the creator to that project.
2. **Idea → Draft storyboard.** Enter a topic or paste notes. Explain what input is needed with one short example. Save the input before calling the planning service. For a broad topic, propose one teachable takeaway. If the notes conflict or lack the information needed for a meaningful draft, ask one focused question. Empty input keeps the creator in the form. Surface length limits before submission and preserve oversized input for editing.
3. **Storyboard → Approval.** Present one card per scene in playback order. Each contains narration, on-screen text, a concrete visual plan and estimated timing. Show the total estimate. Allow direct edits to narration and visual instructions, plus conversational changes to a scene or the whole project. Show proposed changes for review before applying them. Generate video is the explicit approval of the displayed storyboard revision.
4. **Generate → Preview.** Show current stage and whether the creator can leave safely. Generate audio, align captions and animation cues, render and validate the file. The dashboard reflects progress after a refresh. On completion show a playable vertical preview with sound, captions, actual runtime and export controls. Starting generation never authorizes publication.
5. **Preview → Revise.** A creator can correct caption text directly or describe a change. Show the affected scenes and request approval for changed narration or meaning. Retain the previous playable version while the revision renders. A failed revision leaves the previous video available for download.
6. **Preview → Download or publish.** MP4 download works independently of Instagram. To post, select a completed version, review its preview, target account and editable post caption, then choose Publish now or Schedule. Show the scheduled local date, time and timezone together. Confirm the exact action before submission. Return a post link when available or a clear status and recovery action.

## 4. Storyboard and generation contract

| Component | Required behavior |
|---|---|
| Planner · Gemini Flash-class model | Treat notes as source material. Draft one learning objective and a sequence that explains it. Keep claims consistent with supplied facts and flag uncertain details for review. Output structured scene data with stable IDs, narration, visual elements, cue phrases and estimated durations. Validate the structure before presenting it. |
| Scene design · Remotion | Map the plan to supported compositions such as a labeled diagram, comparison or process with arrows. Store editable parameters for each scene. If the requested illustration cannot be represented faithfully, offer a simpler labeled depiction for approval. Never execute code supplied by the planner. |
| Voice · ElevenLabs | Generate approved narration by scene with the selected voice and retain audio plus alignment. Preserve voice continuity across revisions. A voice change creates a new version and regenerates narration and timing throughout. Use actual audio length to place pauses and transitions. Support spoken-form revisions while preserving the intended display label. |
| Captions and cues | Group speech timestamps into readable phrases. Place captions inside a phone-safe area and keep them clear of diagram labels. Tie each meaningful visual change to its spoken phrase. Allow a spelling correction to reuse audio. Changed spoken wording requires new timing for the affected scene. |
| Final render | Use the same scene data for preview and export. Produce a portrait H.264 MP4 with AAC audio at 1080 × 1920. Validate dimensions, duration including all transitions, playable sound and completed file before exposing publish controls. |

The AI chooses an estimated duration from 60 to 90 seconds based on the topic and level of detail. Creators can ask for a shorter or more detailed explanation in plain language. Use measured narration, pauses and transitions to check runtime before rendering, then validate the finished MP4 against the inclusive range. If the assembled sequence exceeds 90 seconds, propose a concise rewrite. If it falls below 60 seconds, propose giving the visual more time or adding a meaningful example. Let the creator approve a proposed change and preserve natural delivery.

**Example acceptance flow.** For “How does a solar eclipse happen?”, preview the Sun, Moon and Earth positions and the planned shadow animation. “Make the shadow easier to see” changes the indicated scene and reuses its narration. “Explain the shadow more simply” proposes revised words, then regenerates that scene’s audio and timing after approval. Later scenes shift on the timeline to accommodate the measured duration.

## 5. Project state and reliability

Track editing, generation and publishing separately. A project can have a newer draft, a playable earlier render and a scheduled post at the same time.

| Record | State and ownership |
|---|---|
| Project and storyboard revision | Owner, input, title, scene list, revision number, timestamps and approved revision ID. Autosave displays Saving, Saved or Save failed. Moving between stages retains the latest acknowledged save. |
| Generation job | Bound to one approved revision. Queued → generating narration → preparing animation → rendering → validating → ready. Failure records the failed step and whether retry is available. Repeated clicks reuse the active job. |
| Render version | Immutable references to storyboard, voice assets, captions, timing, settings and final artifact. A new generation creates a new version. Earlier job completion cannot overwrite a newer draft. |
| Publishing job | Owner, account ID, exact render version, post caption, publish time in UTC, display timezone, approval and provider receipt. States include scheduled, submitting, processing, published, action required, failed and canceled. |

Autosave after a short pause and before stage transitions. On connectivity loss show unsaved status and retain pending edits in the current session. Warn before leaving with unsaved changes. On conflicting edits from two tabs, keep both sets of work available and ask which revision to continue. Job execution must survive closing the browser. Persist successfully completed steps and reuse assets when their inputs match. Retry temporary provider failures with bounded backoff. Surface a clear recovery action after exhaustion. Keep credentials and provider error payloads out of user-facing messages.

## 6. Instagram behavior

The creator clicks **Connect Instagram** on their dashboard. Open Meta’s authorization screen for an eligible Instagram professional account. Verify the OAuth callback against the creator session and a single-use authorization state before exchanging the code server-side. Store the authorized account ID and encrypted token against that workspace, then show the connected @handle on the dashboard and at publishing confirmation. Each creator can have one active destination and each destination belongs to one workspace. Changing accounts holds schedules bound to the previous account until the creator explicitly reviews and approves the new destination. Handle denied permission, canceled authorization, ineligible accounts, expired credentials and revoked access. In each case the creator can still preview and export. Verify Meta access and required publishing permissions with the pilot accounts before enabling live posts.

Scheduling snapshots the approved render, caption and destination. Subsequent edits create a draft. Replacing a scheduled version requires explicit review and confirmation. Permit rescheduling or cancellation until submission begins. Resolve simultaneous cancellation and dispatch atomically and show the actual outcome. Reject past times and clarify ambiguous or nonexistent local times around daylight-saving changes.

On dispatch, recheck account identity, authorization and media availability. Record provider identifiers as soon as available. A timeout after submission has an uncertain outcome. Check the existing provider status before retrying and show action required if publication cannot be determined. Never automatically submit a second post in that state. For a missed schedule after an outage, show the missed time and offer Publish now or Reschedule. Disconnecting the account prevents pending posts from dispatching and identifies affected schedules.

## 7. Quality, privacy and operating controls

- Enforce project visibility and publishing permissions for projects, drafts, media, jobs and account connections on every server operation. Keep provider keys server-side, encrypt social tokens, and give the publishing provider time-limited access to the approved media.
- Keep customer scripts, notes and access tokens out of routine analytics. Tell creators which providers receive text or audio. Use public sample content on free tiers during evaluation. Confirm production data terms and commercial voice rights before generating commercial output.
- Use original or appropriately licensed icon and illustration assets. Include only supported inputs in model calls, validate outputs and give a recoverable explanation when a provider declines content.
- Support keyboard operation, visible focus, labeled player controls, readable caption contrast and status text independent of color. Check the exported video on a phone for clipped labels, crowded captions and unreadable diagrams.
- Internally record model usage, voice generation, retries, render time, storage and cost per completed video. Set operator alerts and bounded retry limits. Reuse existing audio during visual-only edits. Distinguish unavailable capacity from a content error and preserve drafts in both cases.

## 8. Release acceptance scenarios

| Scenario | Pass condition |
|---|---|
| New user to first export | A creator signs in, submits notes, approves a storyboard and downloads a playable portrait MP4 with synchronized narration and captions without connecting Instagram. |
| Creator requests shorter or more detailed | The storyboard reflects the requested change and estimated length. A finished file of exactly 60 or 90 seconds passes. A file outside the range returns for correction before publishing. |
| Single-scene revision | Approved neighboring scenes retain their content. A visual-only change makes zero additional TTS requests. Revised narration updates captions and subsequent scene offsets. |
| Caption correction | Correcting a displayed name changes the preview and new export while preserving the spoken audio. |
| Voice choice | Both Indian-English voices have playable previews. A project override takes precedence over the dashboard default. Changing a project voice recalculates captions and animation timing. |
| Hosted rendering | A 90-second explainer renders in Vercel Sandbox and the validated Cloudinary MP4 plays after the sandbox closes. |
| Refresh, concurrent edits and double clicks | Saved drafts reopen, in-progress jobs continue, stale writes cannot silently replace newer edits and duplicate clicks create one active job. |
| Invalid model response, missing timing or render failure | No broken output becomes ready. The creator sees the failed stage and can retry while retaining approved work and any previous export. |
| Scheduled version edited later | The originally approved file posts unless the creator explicitly replaces it. Cancellation completed before dispatch produces no post. |
| Instagram failure | Ineligible accounts can download. Expired authorization prompts reconnection. A lost response after submission cannot trigger duplicate publication. |
| Instagram destination | OAuth connects the intended professional account and confirmation displays its handle. Switching the account holds existing scheduled posts for review. Disconnecting affects only that creator’s jobs. |
| Account isolation | Two invited creators have separate dashboards and Instagram connections. Copied identifiers grant no access to another creator’s draft, render, private media or publishing job. A Google account outside the allowlist cannot enter the pilot. |

## 9. Pilot, measurement and release decisions

**First experiment.** Build the topic-to-MP4 path locally using public notes, an available Gemini free-tier model, timestamped ElevenLabs narration and Remotion. Keep ElevenLabs free-tier output to noncommercial evaluation and follow its attribution terms where applicable. Use a plan with commercial rights when generating commercial narration. Audition both voices on the same script with an Indian place name, a rupee amount and a technical term before selecting the account-specific voice IDs. Test a process diagram, a comparison and an illustrated concept. Check visual accuracy, caption timing, isolated scene revisions and actual runtime.

**Internal pilot.** Two testers sign in independently, each enter a distinct topic and connect a different eligible Instagram account. Verify each dashboard shows only its own ideas, drafts, videos, schedules and destination. Attempt cross-workspace access by direct project link and publish request and verify both are denied. Disconnect one account and confirm only its schedules are affected. Measure render success, correction time and internal cost per finished video.

**Pilot readiness.** Pass the acceptance scenarios and test interrupted renders and uncertain publishing outcomes using an individually authorized account. Public rollout, retention and backup policies, database design and development planning are deferred.

**Provider references.** [Gemini API pricing and data tiers](https://ai.google.dev/gemini-api/docs/pricing) · [ElevenLabs speech timing](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps) · [ElevenLabs usage rights](https://elevenlabs.io/docs/overview/administration/billing) · [Remotion licensing](https://www.remotion.dev/pricing) · [Meta Instagram platform updates](https://developers.facebook.com/docs/instagram/platform/instagram-api/changelog/)
