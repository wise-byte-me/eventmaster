# Railway migration — eventmaster

Approved by Tim Wise on October 25, 2026. Source commit: `a604cc9d72bce9c78e8245d676b4a2299c9eed27`.

Not migrated. Source dependencies inspected. Source database/files and runtime credentials not transferred; no production cutover.

Create React App frontend with Supabase database/auth. Requires build-time REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY. Inventory SQL, auth users, policies, buckets and functions before replacing Supabase. Production static hosting configuration still required.

## Required preservation and cutover checks

- [ ] Preserve source code and source database backup; do not overwrite/reset production data.
- [ ] Inventory database schema and exact row counts, including users, IDs, permissions, subscriptions and relationships.
- [ ] Import into an isolated Railway database; compare row counts and selected records.
- [ ] Inventory stored files and URLs; copy with byte counts/checksums and preserve access rules.
- [ ] Preserve account identity; test OAuth callbacks, cookies, logout, owner/admin and ordinary users. Do not auto-merge accounts by email.
- [ ] Inventory scheduled jobs, queue consumers and webhook routes. Enable each job once after cutover to avoid duplicate sends/charges.
- [ ] Preserve Stripe customer/subscription IDs and account; configure signature-verified webhooks. Do not create duplicate subscriptions.
- [ ] Configure AI, email, GHL, voice, realtime and other integrations actually used by this app.
- [ ] Test app-specific workflows and uploads against the isolated database.
- [ ] Verify DNS, HTTPS, root/WWW, redirects and login before live domain cutover; retain rollback.

## Current source-access blocker

Manus sign-in is working. In the inspected VibeCode project, database settings expose a masked MySQL connection string, but its copy control returned an empty clipboard and its export action did not produce a downloadable file in this browser. No source data has been reset or replaced. Obtain a usable database export or secure source connection and file inventory before marking data transfer complete. This observation has not yet been verified for every other Manus project.

## Detected dependencies

Database: Supabase. Storage SDK: false. Stripe SDK: false. AI SDK: false. Dependencies alone do not confirm a live service is configured.
