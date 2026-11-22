# Feedback frontend prototype

Selected scope: BETA-FB-001 through BETA-FB-006, revised by the user's 2026-11-21 request before application changes. This supersedes the earlier demo/triage scope.

| Requirement | Selected scope |
| --- | --- |
| BETA-FB-001 | Feedback action in the existing header near the profile, including narrow screens. No hint. |
| BETA-FB-002 | Right-side panel on desktop, full-width on mobile, with conversational wording and clear issue/suggestion choices; Share feedback heading; Type (Report an issue / Suggest an improvement), Title, Description, optional screenshot, Cancel and Submit. Required-field validation, loading, simple success; preserve draft on failure. |
| BETA-FB-003 | Behind-the-scenes last 30 allowlisted actions and sanitized route templates, frozen at open. No typed contents, credentials, tokens or entity IDs; no activity/technical UI in the user-facing panel. Admin tickets show the sanitized action timeline. |
| BETA-FB-004 | Replaceable asynchronous mock submission and local storage interfaces; persist reports and screenshot in this browser/origin; failures preserve draft. No external requests. |
| BETA-FB-005 | Separate /feedback-admin layout, shared Liam Parker account through isolated mock auth with temporary development credentials documented outside UI. Login ID is Liam Parker (case-insensitive). Empty initial list, differentiated Issue / Bug and Suggestion badges, and detail with only Open / Closed status changes. New and previously unclassified reports start Open. No seeds, analytics or advanced workflow. |
| BETA-FB-006 | Reuse React/Tailwind/Lucide and existing feedback primitives; modular services, developer integration documentation, form/attachment/submission/dashboard/responsive and regression verification. |

No backend, database, deployment or real authentication. Liam's actual email/password are unknown. Existing SPC roles and state transitions remain unchanged.

Screenshot validation: one PNG, JPEG or WebP image, non-empty and at most 2 MiB; reject unreadable images. Title and description are non-whitespace, limited to 140 and 5,000 characters. Storage failures are submission failures, never false success.

Verification: TEST-BETA-FB-01 (submit and read), TEST-BETA-FB-02 (failure and persistence), TEST-BETA-FB-03 (privacy, accessibility and responsive layout).

ID follow-up (BETA-FB-004/005): allocate persistent readable IDs such as FB-00001 for new and existing local feedback. Show IDs only in the admin list and detail; never in the user-facing form or confirmation. Internal UUID references remain unchanged.

Admin ticket follow-up (2026-11-22, BETA-FB-003/004/005/006): show captured actions with time, module, sanitized page and outcome only inside admin tickets, alongside description and optional screenshot. Provide search by ID/title/description and combinable type, Open/Closed and category filters. Category is separate from status: Unclassified, Product, Engineering or AI; new/existing reports default Unclassified, editable by admins with persistent save/error handling. No typed values, secrets or raw browser metadata are exposed.
