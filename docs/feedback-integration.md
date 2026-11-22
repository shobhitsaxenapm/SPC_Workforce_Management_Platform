# Feedback integration

Scope: BETA-FB-001 through BETA-FB-006. Frontend-only prototype; no backend, database, deployment, real authentication or external feedback service.

## Development access

Open `/feedback-admin` on the same origin as SPC. Temporary development credentials:

- Login ID: `Liam Parker` (case-insensitive)
- Password: `local-feedback-only`
- Shared display account: Liam Parker

The login ID is the requested shared name; the password is a public development placeholder, not Liam's actual password. His actual credentials have not been supplied. The adapter in `src/feedback/auth.ts` is a mock UI gate, not secure or production-ready authentication. Never replace these constants with real secrets. The mock stores only an active-session marker in sessionStorage, not passwords.

## Integration points

- `FeedbackProvider` wraps the existing authenticated `Layout`; `FeedbackButton` sits immediately before its profile. Opening the modal leaves underlying SPC work mounted.
- `FeedbackPanel` reuses `FeedbackDialog` and the feedback field/button primitives, with a right-side desktop panel, full-width mobile layout, and conversational issue/suggestion prompts. It accepts an injected `FeedbackService`.
- `FeedbackService` in `model.ts` supplies submit, setStatus, refresh and a subscription/snapshot pair. Replace the mock with an API-backed adapter later; preserve promise rejection so drafts remain available on failure.
- `FeedbackStorage` isolates read/write persistence. `createLocalFeedbackStorage` implements it with localStorage; `createMockFeedbackService` accepts any implementation for integration and failure tests.
- `FeedbackAuth` isolates getAccount/login/logout. `FeedbackAdmin` accepts this interface independently of the SPC account and navigation. Replace it with a server-validated session when integrating actual authentication.
- `activity.ts` retains only the last 30 known navigation/operation names, sanitized route templates, timestamps and outcomes. It does not listen to input events or capture form values, error messages, query strings, entity IDs, passwords or tokens. No reporter identity, browser details or technical preview is displayed or collected by the modal. Activity resets on refresh/user change/logout and is copied when the modal opens.
- `screenshot.ts` validates one PNG/JPEG/WebP image up to 2 MiB and decodes it before attachment. The original image is stored locally as a data URL. No screenshot is captured automatically.

## Local limitations

Reports, voluntarily entered report text, selected images and sanitized activity persist under `spc_feedback_v2`. They are available only in the same browser/origin. This is not team synchronization or protected storage. Clear site data to remove local submissions. Screenshot contents are user-selected and are not redacted.

The new empty store intentionally does not import old `spc_beta_feedback_v1` sample reports or old mock login sessions. Those keys are left untouched, preserving prior data without showing invented reports. No seed/reset workflow exists.

Writes must succeed before showing success. Full, blocked or malformed storage rejects submission and retains the complete draft. Read errors show a retry action on the dashboard and never silently overwrite unreadable data. The dashboard refreshes on focus and storage events; truly simultaneous cross-tab writes are not transactionally synchronized. A backend is required for reliable shared multi-user use.

No feedback code makes network requests. Other pre-existing SPC features, such as Gemini parsing, are outside this scope.

## Verification

Run `npm run lint`, `npm test`, `npm run build`. With Node 22.11, tests require PowerShell `$env:NODE_OPTIONS='--experimental-require-module'`. The existing build config needs a process-local `GEMINI_API_KEY` placeholder when no real key is available; feedback does not use that key.

Automated tests cover validation, both types, attachment validation/removal, failed-write draft retention, duplicate prevention while loading, persistence with image, login/logout, empty list, detail and storage-event refresh. jsdom shims image decode and native dialog opening; real image rendering, focus trapping and responsive visual checks still require browser verification. See `docs/qa/end-to-end-test-scenarios.md` for execution evidence.

Reports start Open; only Open and Closed are accepted. Existing v2 reports without a status load as Open. Closing/reopening persists through the same replaceable service and leaves the prior status intact when a write fails. Type badges distinguish Issue / Bug from Suggestion without introducing a third type.

Admin-only readable IDs: `adminId` uses FB-00001, FB-00002, etc. The admin list/detail show it; the submission form and confirmation do not. Existing v2 reports receive persisted IDs oldest-first on first read, preserving UUID references. Allocation is local to this browser/origin; a future backend must allocate IDs centrally for shared use. Failed migration writes surface the existing load error without overwriting or dropping reports.

Admin ticket details now render the stored safe action snapshot (action, outcome, module, route template and time), description and attached screenshot; absent screenshots/actions have honest empty states. User-facing feedback stays free of activity metadata. Category is independent of Open/Closed: Unclassified (default), Product, Engineering, AI. `FeedbackService.setCategory` validates and persists it, retaining previous state on failure. The admin list combines case-insensitive ID/title/description search with type, status and category filters, retaining filters when returning from a ticket. Existing action capture coverage remains unchanged; no click replay, keystrokes or automatic screenshots are added.
