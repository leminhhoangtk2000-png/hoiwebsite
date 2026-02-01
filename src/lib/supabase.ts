import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

// WARNING: This client does not handle cookies and will fail RLS policies that rely on authentication.
// Use '@/lib/supabase-server' for Server Components.
// Use '@/lib/supabase-client' for Client Components.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

