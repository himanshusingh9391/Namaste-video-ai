# Namaste Video database design

**MongoDB Atlas · V1 private pilot · Proposed persistence contract** · [API design](API_DESIGN.md) · [System design](SYSTEM_DESIGN.md)

## Ownership and record conventions

One Better Auth user owns one workspace. Use its stable user ID as ownerId on application records. Use opaque string IDs at the API boundary, BSON UTC dates for instants, integers for counters and frame offsets, and an IANA timezone for local scheduling. Mutable records carry updatedAt; versioned application documents carry schemaVersion. The examples below use short IDs for readability. MongoDB references require explicit application-level ownership and existence checks on every read and mutation.

Embed a bounded working storyboard in projects so autosave is a single conditional write. Freeze an approved copy into revisions, then reference it from each job and render. Store growing job histories, publications and media in separate collections. This lets a project show an edited draft while an older render remains downloadable and a third version is scheduled.

## Record catalog

| Collection | Fields and constraints | Relationships and lifecycle |
|---|---|---|
| Better Auth adapter collections | Provider-managed users, sessions, accounts and verification records. Apply indexes and migrations for the adapter version chosen at implementation. | Google login identifies a user. Instagram authorization lives separately. |
| pilotInvites | normalizedEmail string, status active/revoked, createdAt date | Check verified email at admission and recheck access before protected work. |
| preferences | ownerId, voiceId, timezone | One per creator; copy effective voice into each approved revision. |
| projects | ownerId, title, draft object, draftVersion integer, lastStage, activeGenerationId?, latestReadyRenderId?, createdAt, updatedAt | Draft contains notes, selected voice and ordered scenes with stable scene and phrase IDs. References are nullable before first generation. |
| revisions | ownerId, projectId, parentRevisionId?, approvedDraftVersion, scenes, source notes snapshot, voice snapshot, templateBuild, contentHash, approvedAt | Immutable render input. Store pronunciation and synthesis settings alongside exact voice/model IDs. |
| proposals | ownerId, projectId, baseVersion, typed changes[], status pending/applied/discarded, createdAt, appliedVersion? | Proposed initial plan can replace the scene array. Later proposals target stable IDs; base version guards against overwriting newer edits. |
| jobs | ownerId, projectId, kind plan/proposal/generation, revisionId?, baseVersion?, state, stage, attempt, leaseToken?, leaseUntil?, checkpoints[], result?, error?, createdAt, updatedAt | Keep per-scene asset references and provider receipts in checkpoints; avoid duplicating raw audio or provider payloads. |
| assets | ownerId, projectId, kind, inputDigest, providerAssetId, providerVersion, checksum, bytes, durationSamples?, sampleRate?, alignmentRef?, validationState | Audio, alignment, thumbnails and videos live in authenticated Cloudinary storage. Store stable references and generate expiring delivery URLs on demand. |
| renders | ownerId, projectId, revisionId, jobId, assetId, manifestRef, sceneOffsetsFrames[], totalFrames, fps, dimensions, videoCodec, audioCodec, verifiedAt | Insert after export validation; use actual duration when checking file bounds. |
| connections | ownerId, providerAccountId, handle, generation, active boolean, status, encryptedToken, keyVersion, expiresAt, grants[] | Preserve the destination identity across token refresh. Replacement or disconnection invalidates the prior binding for future dispatch. |
| oauthStates | stateHash, ownerId, sessionBinding, returnPath, expiresAt, consumedAt? | Consume once with owner, session and expiry conditions. Redirect only to an allowlisted local path. |
| publications | ownerId, projectId, renderId, connectionId, connectionGeneration, destinationAccountId, handleSnapshot, caption, approvedAt, scheduledAtUTC?, timezone, state, scheduleVersion, containerId?, mediaId?, permalink?, error? | A post approval binds an exact render and destination. Changing a schedule increments its version and invalidates stale wakes. |
| operations | ownerId, operationScope, key, requestHash, httpStatus, responseBody, createdAt | Record accepted work-creating commands for idempotent HTTP replay. Keep operation keys for the pilot; a cleanup interval is a later retention decision. |
| outbox | eventId, ownerId, aggregateId, expectedVersion, kind, availableAt, attempt, sentAt?, leaseUntil? | Reliable handoff between the committed database change and Inngest. Workers must tolerate duplicate delivery. |

## Example records at the scheduling boundary

```json
{
  "_id": "pub1",
  "schemaVersion": 1,
  "ownerId": "u1",
  "projectId": "p1",
  "renderId": "v2",
  "connectionId": "ig1",
  "connectionGeneration": 1,
  "destinationAccountId": "meta-example",
  "handleSnapshot": "@example",
  "caption": "The water cycle",
  "approvedAt": "2026-11-25T10:20:00Z",
  "scheduledAtUTC": "2026-11-26T12:30:00Z",
  "timezone": "Asia/Kolkata",
  "state": "scheduled",
  "scheduleVersion": 1
}
```

The matching outbox record uses kind=publication.scheduled, aggregateId=pub1, expectedVersion=1. Deliver that event promptly so Inngest registers the wait. The publication itself holds the due time. The job re-reads the publication and connection on wake. A browser can close as soon as the transaction commits.

## Indexes and the queries they serve

Notation uses fields in compound-index order. Ascending is the default; minus denotes descending.

| Query or invariant | Index |
|---|---|
| Sign-in admission; one preference record | Unique pilotInvites(normalizedEmail); unique preferences(ownerId) |
| Dashboard ordered by most recent change | projects(ownerId, -updatedAt, -_id). Seek after the last pair from the cursor. |
| One approval per saved project version; revision history | Unique revisions(projectId, approvedDraftVersion); revisions(ownerId, projectId, -approvedAt) |
| Pending review | proposals(ownerId, projectId, status, -createdAt) |
| Recover expired jobs; find active project work | jobs(state, leaseUntil); jobs(ownerId, projectId, -createdAt) |
| Coalesce duplicate generation approvals | Unique jobs(revisionId, kind) filtered to generation jobs. Retry advances attempt on the same job. |
| Reuse assets only inside one creator project | Unique assets(ownerId, projectId, kind, inputDigest). Include revision/render parameters in the digest for export assets. |
| Render history; one verified result per job | renders(ownerId, projectId, -verifiedAt, -_id); unique renders(jobId) |
| One active connection per creator and per Instagram account | Two unique partial indexes: connections(ownerId) and connections(providerAccountId), both filtered to active=true |
| OAuth replay and stale state cleanup | Unique oauthStates(stateHash); TTL oauthStates(expiresAt), expireAfterSeconds=0. Check expiry during consumption regardless of cleanup timing. |
| Upcoming posts, dashboard projections, due-job recovery | publications(ownerId, scheduledAtUTC); publications(ownerId, projectId, -approvedAt); publications(state, scheduledAtUTC) |
| Request replay; pending event scan | Unique operations(ownerId, operationScope, key); unique outbox(eventId); outbox(sentAt, availableAt) |

## Atomic writes and recovery

1. **Autosave.** Filter projects on _id, ownerId and draftVersion. Validate stable scene IDs and all fields before applying the batch. Increment draftVersion in the same write. A zero-match update triggers an owner-scoped reread to distinguish a stale version from an inaccessible project.
2. **Apply proposal.** In a transaction, verify pending status and matching baseVersion, update the draft and increment its version, then mark the proposal applied with the resulting version. A discarded or stale proposal cannot be applied by a delayed request.
3. **Approve generation.** Check draftVersion and voice, freeze the revision, create the job, set activeGenerationId, and write the operation response and outbox event in one transaction. For a duplicate revision/job key, resolve to the already accepted generation. Provider calls occur after commit.
4. **Complete a render.** Upload and validate the immutable output, then commit the asset, render and job success together. Update latestReadyRenderId only if the project still points to that job as its active generation. A late completion is available in history. After a crash between upload and commit, verify the stored file by owner, job and checksum before reuse.
5. **Approve or update a publication.** Verify owner, render, current connection identity and generation. Save approval, operation result and versioned wake event atomically. Reschedule, cancel and dispatch compare state and scheduleVersion. A losing transition reports current state. Disconnect invalidates the active connection before returning; a worker must verify it again before dispatch. Provider submissions already in flight require reconciliation.
6. **Uncertain external outcome.** Save a known container ID before calling publish. If Meta times out, mark the record uncertain and query the container or media receipt. Escalate an unresolved result to the creator. Database uniqueness can prevent duplicate local jobs; external publishing still needs this recovery path.

## Security, evolution and database tests

Use separate Atlas environments and least-privilege application and workflow credentials. Encrypt provider tokens with authenticated encryption; retain key ID, nonce, ciphertext and authentication tag. Restrict token decryption to connection and publishing handlers. Keep private media URLs and raw provider errors out of client-visible records and logs. Bound request and scene sizes before writes. Use additive schema changes, record schemaVersion, and test old approved manifests against their pinned renderer builds before rollout.

Test the indexes and transactions against a replica-set-backed database. Race two approvals for one draft, two claims for one lease, two creators connecting one Instagram identity, and a cancel against a publish claim. Inject failure after upload and after event delivery. Verify that two creators cannot read each other's documents or derive playable media from copied IDs. Run explain plans for dashboard pagination and due-post scans against realistic pilot data. Business retention, backup targets and public-launch policies remain deferred under the PRD.
