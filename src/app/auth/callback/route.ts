
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = {
            get(name: string) {
                return request.headers.get('Cookie')?.split('; ').find((c) => c.startsWith(`${name}=`))?.split('=')[1]
            },
            set(name: string, value: string, options: CookieOptions) {
                // No-op for now, actual cookie setting happens in response
            },
            remove(name: string, options: CookieOptions) {
                // No-op
            },
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        // In route handler, we read from request cookies
                        const cookie = request.headers.get('Cookie') || ''
                        const found = cookie.split('; ').find(row => row.startsWith(`${name}=`))
                        return found ? found.split('=')[1] : undefined
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Note: In Next.js Route Handlers, we need to set cookies on the *response* object.
                        // But supabase/ssr exchanges the code and sets the session on the client itself if we just call plain exchangeCodeForSession?
                        // Actually, the new @supabase/ssr pattern is a bit specific. 
                        // Let's use the standard Next.js approach with NextResponse.
                    },
                    remove(name: string, options: CookieOptions) {
                        // ...
                    },
                },
            }
        )

        // Correct way with @supabase/ssr in Route Handler:
        // We need to create a response object, and pass cookie methods that modify that response.

        // Let's restart the client creation with the proper pattern for Route Handlers
    }

    // RE-IMPLEMENTATION with correct pattern:
    return handleCallback(request)
}

async function handleCallback(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = new Map<string, { value: string, options: CookieOptions }>()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        const cookieHeader = request.headers.get('Cookie') || ''
                        const cookies = Object.fromEntries(
                            cookieHeader.split('; ').map(c => c.split('='))
                        )
                        return cookies[name]
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set(name, { value, options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set(name, { value: '', options: { ...options, maxAge: 0 } })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const response = NextResponse.redirect(`${requestUrl.origin}${next}`)

            // Apply the cookies set by Supabase to the response
            cookieStore.forEach(({ value, options }, name) => {
                response.cookies.set(name, value, options)
            })

            return response
        } else {
            console.error('Auth callback error:', error)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
}
