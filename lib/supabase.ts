import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper function to get the current user on client side
export async function getCurrentUserClient() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}