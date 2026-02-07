# Environment Variables Setup

## Required Environment Variables

Add the following to your `.env.local` file in the `frontend` directory:

```env
# Public Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server-side Supabase Configuration (REQUIRED for team member creation)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How to Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Under **Project API keys**, find the **service_role** key
4. Copy it and add to `.env.local`

> [!WARNING]
> **NEVER** commit the service role key to version control!
> This key has admin privileges and should only be used server-side.

## File Location

Create or update: `d:\index plus\frontend\.env.local`
