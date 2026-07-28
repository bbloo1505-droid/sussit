# Supabase project

Dashboard: https://supabase.com/dashboard/project/lcvtjoiqmboeazimpvbq

## Keys (Settings → API)

Add to `.env`:

```bash
VITE_SUPABASE_URL=https://lcvtjoiqmboeazimpvbq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # anon / public
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # service_role (server only)
```

URL is already set. Paste the two JWT keys from the dashboard.

## Status

- Project linked: `lcvtjoiqmboeazimpvbq`
- Migration applied: `20260727_sell_speed.sql`
- Anon key configured in `.env`
- V0 products seeded; Flip sales + poll observations persist when online

Optional later: `SUPABASE_SERVICE_ROLE_KEY` / secret key for server-only writes.