
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function DebugAuthPage() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    let profile = null
    let profileError = null

    if (user) {
        const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        profile = result.data
        profileError = result.error
    }

    return (
        <div className="p-8 max-w-4xl mx-auto font-mono text-sm">
            <h1 className="text-2xl font-bold mb-6 text-red-600">Admin Access Debugger</h1>

            <div className="space-y-6">
                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold mb-2">1. Auth User (supabase.auth.getUser())</h2>
                    {user ? (
                        <div className="text-green-600">
                            <p>ID: {user.id}</p>
                            <p>Email: {user.email}</p>
                            <p>Role: {user.role}</p>
                            <p>Last Sign In: {user.last_sign_in_at}</p>
                        </div>
                    ) : (
                        <p className="text-red-500">Not Logged In (Error: {userError?.message})</p>
                    )}
                </div>

                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold mb-2">2. Profile Data (public.profiles)</h2>
                    {profile ? (
                        <div className={profile.role === 'admin' ? "text-green-600 font-bold" : "text-orange-600"}>
                            <p>ID: {profile.id}</p>
                            <p>Email: {profile.email}</p>
                            <p>Role Column: "{profile.role}"</p>
                            <p>Is Admin?: {profile.role === 'admin' ? 'YES' : 'NO'}</p>
                        </div>
                    ) : (
                        <div className="text-red-500">
                            <p>Could not fetch profile.</p>
                            <p>Error Code: {profileError?.code}</p>
                            <p>Error Message: {profileError?.message}</p>
                            <p>Hint: If code is 42501, it is RLS (Permission) issue.</p>
                            <p>Hint: If code is PGRST116, user not found in table.</p>
                        </div>
                    )}
                </div>

                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold mb-2">3. Environment Variables</h2>
                    <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
                    <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
                </div>
            </div>
        </div>
    )
}
