
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Get User Session
    const { data: { session } } = await supabase.auth.getSession()

    // ROUTE PROTECTION LOGIC

    // 1. Protect Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Check if user is logged in
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check if user is Admin
        // Note: Fetching from DB in middleware can add latency. 
        // Optimization: Store role in jwt metadata (requires token refresh logic) or just fetch here for safety.
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        console.log('[Middleware] Checking Admin Access:', {
            userId: session.user.id,
            role: profile?.role,
            error: error?.message
        });

        if (profile?.role !== 'admin') {
            console.log('[Middleware] Access Denied: Role is', profile?.role);
            // Not allowed
            return NextResponse.redirect(new URL('/', request.url)) // Redirect to Home
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
