# PawConnect

## Run locally (VS Code)
`npm install` → copy `.env.example` to `.env` and fill in values → `npm run dev`.

## Environment variables (frontend; both are safe to expose)
| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | same page, **anon/public** key |

**Never** put the `service_role` key in `.env` or any `VITE_` variable: it bypasses all security and would ship to browsers. It is only for a future server-side payment webhook.

## Setup (in order)
1. Create a Supabase project; fill `.env`.
2. SQL Editor: run `supabase/schema.sql`, then `supabase/002_platform.sql` (tables, RLS, triggers, storage buckets, realtime).
3. Authentication → Email: minimum password length 8; choose whether to require email confirmation; add your site URL.
4. Register, then make the first admin: `update public.profiles set role='admin' where email='you@example.com';`
5. Storage: confirm buckets `pet-media` (public read) and `ngo-docs` (private) exist.
6. The app starts with no pets. Register as Pet Owner/NGO and add listings (sample pets only show when Supabase is NOT configured).

## What's implemented (all REQUIRE the setup above; none tested against a live project)
Auth & roles · persistent profiles · pet listings with photo/video upload · adoption applications · approve/reject · private chat (realtime) · notifications (DB triggers) · application tracking · adoption agreement (template) with signing · 7/30/90-day follow-ups · NGO verification (document upload + admin review) · volunteer posts (verified NGOs only) · foster & lost/found posts with responses · admin moderation (listings, posts, reports, roles).

## Security model
- Every table has RLS. Chat is visible only to the adopter and pet owner (admins cannot read it). Adopter answers are visible only to the adopter and that pet's owner.
- `public_profiles` view exposes only id/name/role/verified; email and phone stay private to the owner of the profile and admins.
- Roles, pet status, application decisions, NGO verification and notifications can't be set directly by clients; only via triggers/RPCs.
- Uploads: users write only to their own storage folder; type and size limits are enforced in the bucket and in forms. NGO documents are private (admins get short-lived signed links).

## Prepared, NOT live
Donations, NGO subscriptions and sponsorships: tables + read-only RLS exist, and the **Support** page shows disabled buttons. No payment provider is integrated and nothing is collected. Needs: a provider account, a server/edge function creating checkouts, and a webhook (using the service role on the server only).

## Not built / known gaps
- Email/push notifications (in-app only); password reset; rate limiting/CAPTCHA; automated tests against real Supabase.
- Editing or deleting listings from the UI; follow-up notes; reply threads for community posts beyond one-line responses.
- Agreement text is a template, not legal advice. Legal review recommended before real use.
- Volunteer role currently has no special permissions beyond browsing and responding to posts.

## Optional preview build (needs `npm install` first)
`npm run build:preview` builds `preview.html` (uses a stubbed Supabase, so the hosted preview shows auth/data features as "not configured").
