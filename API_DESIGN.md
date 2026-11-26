# Namaste Video dashboard API

**V1 pilot · Proposed HTTP contract for design review** · [System design](SYSTEM_DESIGN.md) · [Database design](DATABASE_DESIGN.md)

## Transport and identity

Paths below are relative to `/api`. Requests and responses use UTF-8 JSON except the OAuth redirect and empty 204 responses. Dates are RFC 3339 strings with an offset; instants returned by the API use UTC. IDs are opaque strings. Better Auth handles Google sign-in and its callback under its configured auth handler. Every project route requires a valid same-origin session and current pilot admission. Derive the creator from the session. Ignore no unknown editable fields: reject them with 422. Reject cross-origin mutations; use secure HttpOnly session cookies. Private responses use `Cache-Control: private, no-store`.

Send an `Idempotency-Key` on project creation and commands that start, retry or schedule work. Scope it to creator and operation. A repeated key with the same request returns the original status and body. Changed input with the same key returns 409. Draft and schedule versions separately protect against conflicting edits. A successful 202 means durable acceptance; poll the identified job or publication for the outcome.

## Projects and drafting

| Method and path | Request example or parameters | Success example |
|---|---|---|
| GET /projects | Optional opaque cursor and limit (proposed default 20, maximum 100) | 200 `{"items":[{"id":"p1","title":"The water cycle","draftVersion":8,"lastStage":"storyboard","updatedAt":"2026-11-25T10:00:00Z","thumbnailUrl":null,"generation":{"jobId":"j1","state":"running","stage":"rendering"},"readyRender":{"id":"v1","durationSeconds":77.6},"publication":{"id":"pub1","state":"scheduled","handle":"@example","scheduledAt":"2026-11-26T12:30:00Z"}}],"nextCursor":null}` |
| POST /projects | `{"title":"The water cycle","notes":"Explain how rain returns to the ocean."}` | 201 `{"id":"p1","draftVersion":1,"lastStage":"idea"}` |
| GET /projects/:id | Owner-scoped snapshot for editor and refresh | 200 `{"id":"p1","title":"The water cycle","draftVersion":1,"draft":{"notes":"Explain how rain returns to the ocean.","scenes":[],"voiceId":"daniel"},"lastStage":"idea","activeJob":null,"latestReadyRender":null,"publications":[]}` |
| PATCH /projects/:id/draft | `{"expectedVersion":7,"edits":[{"sceneId":"s3","field":"visualDescription","value":"Show a close-up of the droplet."}]}` | 200 `{"id":"p1","draftVersion":8,"savedAt":"2026-11-25T10:00:00Z"}` |
| POST /projects/:id/plans | `{"expectedVersion":1}`; after clarification include `answer` and `clarificationJobId` | 202 `{"jobId":"jPlan","state":"queued"}` |
| POST /projects/:id/proposals | `{"expectedVersion":8,"sceneIds":["s3"],"instruction":"Show a droplet forming around a particle."}`; an empty target list means the whole project | 202 `{"jobId":"jEdit","state":"queued"}` |
| GET /proposals/:id | Load changes before applying | 200 `{"id":"q1","baseVersion":8,"status":"pending","changes":[{"sceneId":"s3","field":"visual.dropletCloseup","before":false,"after":true}]}` |
| POST /proposals/:id/apply | `{"expectedVersion":8}` | 200 `{"projectId":"p1","draftVersion":9,"status":"applied"}` |
| DELETE /proposals/:id | Discard pending proposal | 204 empty body |

Project-level editable fields are title, notes and voiceId. Scene edits address stable scene or phrase IDs and allow narration, displayed caption, on-screen text and visual description. Validate template-specific visual fields through the catalog. Apply the whole edit list atomically. If a caption differs from spoken wording, preserve both strings. For the first plan, return a proposal with a typed `replaceStoryboard` change, including its candidate scene array. An accepted plan becomes the editable draft. On clarification the job returns `{"type":"clarification","question":"Which audience are you teaching?"}`. Applying a stale proposal returns a conflict and leaves its contents available for review.

## Generation and export

| Method and path | Request example or parameters | Success example |
|---|---|---|
| POST /projects/:id/generations | `{"expectedVersion":9,"voiceId":"daniel"}` after explicit storyboard approval; selected voice must match saved draft | 202 `{"jobId":"j2","revisionId":"r2","state":"queued"}` |
| GET /jobs/:id | Poll about every three seconds while active, back off and refresh on focus | 200 `{"id":"j2","kind":"generation","state":"running","stage":"narrating","progress":{"completedScenes":2,"totalScenes":6},"attempt":1,"retryable":false,"result":null,"error":null}` |
| POST /jobs/:id/retry | `{}` for a recoverable failed job | 202 `{"jobId":"j2","state":"queued","attempt":2}` |
| GET /projects/:id/renders | Optional cursor, same pagination convention | 200 `{"items":[{"id":"v2","revisionId":"r2","durationSeconds":77.6,"width":1080,"height":1920,"voiceId":"daniel","verifiedAt":"2026-11-25T10:15:00Z"}],"nextCursor":null}` |
| GET /renders/:id/media | `mode=playback` (default) or `mode=download` | 200 `{"url":"https://media.example/signed-video","expiresAt":"2026-11-25T10:20:00Z"}` |

Job states: queued, running, succeeded, failed, needs_revision. Generation stages: narrating, timing, rendering, validating, uploading. The UI shows Ready when a succeeded job returns `{"type":"render","renderId":"v2"}`. Planning and proposal jobs return a proposal ID or clarification. An out-of-range timeline returns needs_revision with measured duration and an actionable message. Disable Retry until the creator changes the content. A temporary renderer failure sets failed, a sanitized code, failed stage and retryable=true. Keep the previous ready render available in both cases.

## Settings and Instagram

| Method and path | Request example or parameters | Success example |
|---|---|---|
| GET /voices | Available pilot catalog | 200 `{"items":[{"id":"daniel","name":"Daniel","available":true,"sampleUrl":"/samples/daniel.mp3"}]}` |
| GET /preferences | Current creator | 200 `{"voiceId":"daniel","timezone":"Asia/Kolkata"}` |
| PATCH /preferences | `{"timezone":"Asia/Kolkata","voiceId":"daniel"}` | 200 effective preferences as above |
| GET /instagram/connection | Current active destination | 200 `{"connection":{"id":"ig1","handle":"@example","generation":1,"status":"connected"}}` or `{"connection":null}` |
| POST /instagram/connect | `{}` from Settings or Publish | 200 `{"authorizationUrl":"https://www.instagram.com/..."}`; browser navigates to returned provider URL |
| GET /instagram/callback | Provider supplies code and single-use state, or denial | 303 to a same-origin settings or project page carrying a result code. UI refetches connection. Tokens stay server-side. |
| DELETE /instagram/connection | Disconnect the caller’s destination | 200 `{"status":"disconnected","heldPublicationCount":2}` |
| POST /publications | Example below. Omit scheduledAt for publish now | 202 `{"id":"pub1","state":"scheduled","scheduleVersion":1}` |
| GET /publications/:id | Poll after approval | 200 `{"id":"pub1","renderId":"v2","handle":"@example","caption":"The water cycle","state":"scheduled","scheduleVersion":1,"scheduledAt":"2026-11-26T12:30:00Z","timezone":"Asia/Kolkata","permalink":null,"allowedActions":["reschedule","replace","cancel"]}` |
| PATCH /publications/:id | `{"expectedVersion":1,"scheduledAt":"2026-11-27T12:30:00Z","timezone":"Asia/Kolkata"}`; replacement can also specify renderId, caption and confirmed connection generation | 200 `{"id":"pub1","state":"scheduled","scheduleVersion":2}` |
| POST /publications/:id/cancel | `{"expectedVersion":2}` | 200 `{"id":"pub1","state":"canceled","scheduleVersion":3}` |

```json
{
  "renderId": "v2",
  "connectionId": "ig1",
  "connectionGeneration": 1,
  "caption": "The water cycle",
  "scheduledAt": "2026-11-26T12:30:00Z",
  "timezone": "Asia/Kolkata"
}
```

The confirmation UI displays 26 November, 18:00 India time. The server checks that the render is verified, the destination is still current and the requested time is valid. A published response includes state=published, the provider permalink when available and empty allowedActions. A lost provider response can yield state=uncertain with a message to check the destination. Do not expose a blind Retry button. A disconnect or missed schedule can yield action_required; show reconnect or reschedule according to the cause.

## Errors and UI state fixtures

```json
{
  "error": {
    "code": "DRAFT_CONFLICT",
    "message": "A newer draft is available.",
    "currentVersion": 9,
    "requestId": "req_17"
  }
}
```

| HTTP | Interpretation | Dashboard behavior |
|---|---|---|
| 400 / 422 | Malformed JSON / invalid field or unsupported visual. Validation errors include fieldErrors keyed by input path. | Preserve entered values and show the error at the field. |
| 401 / 403 | Expired session / signed in but outside pilot | Sign in and resume / offer account switch. |
| 404 | Record missing or outside workspace | Same missing-resource screen. |
| 409 | Stale draft, changed destination, replay mismatch, or dispatch already claimed | Use error.code to select compare, refresh confirmation or show current post status. |
| 429 / 503 | Rate limit / temporarily unavailable | Retain draft; respect Retry-After when present. For ambiguous commands, reuse the operation key. |

**Stitch review brief.** Design desktop and mobile versions of sign-in, empty and returning dashboards, idea entry, storyboard editor with proposal comparison, rendering progress, finished preview, Instagram connection and final publish confirmation. Use one project showing draft version 9, ready render v2 and a separate scheduled publication. Also mock save conflict, needs_revision, failed generation with an earlier playable export, revoked Instagram access and uncertain submission. Walk through creating a project, making the condensation edit and scheduling the reviewed render. Record any missing response fields before frontend coding.
