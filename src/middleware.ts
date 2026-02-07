import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey) {
        console.warn('⚠️ Supabase credentials missing or invalid in .env.local. Skipping middleware auth checks.');
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Debugging logs (Server-side console)
    if (user) {
        console.log(`✅ Authenticated User: ${user.email}`);
    } else {
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
            console.log('❌ Unauthenticated attempt to access dashboard');
        }
    }

    const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

    // 1. Guard for unauthenticated users
    if (!user && isDashboardPage) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 2. Guard for authenticated users on login/signup pages
    // Exclude /auth/external bridge from this redirect
    if (user && isAuthPage && !request.nextUrl.pathname.startsWith('/auth/external')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 3. Role-Based Access Control (RBAC) & Status Checks
    if (user && isDashboardPage) {
        // We get the company_id and role from raw user metadata or custom claims
        // In a real app, you might fetch the profile from Supabase if not in JWT
        // For new users, role might be in user_metadata until synced to app_metadata
        // Defaulting to 'owner' for now to ensure creators are not blocked by default
        const role = user.app_metadata?.role || user.user_metadata?.role || 'owner';
        const status = user.app_metadata?.status || 'active'; // active/suspended

        console.log(`👤 Middleware Check -> User: ${user.email}, Role: ${role}, Status: ${status}`);

        // If company is suspended, only allow billing page
        if (status === 'suspended' && !request.nextUrl.pathname.startsWith('/dashboard/billing')) {
            return NextResponse.redirect(new URL('/dashboard/billing', request.url));
        }

        // Role specific restrictions
        if (role === 'agent') {
            const restrictedForAgents = [
                '/dashboard/billing',
                '/dashboard/settings/team',
                '/dashboard/settings/channels',
            ];

            const isRestricted = restrictedForAgents.some(path =>
                request.nextUrl.pathname.startsWith(path)
            );

            if (isRestricted) {
                return NextResponse.redirect(new URL('/dashboard/inbox', request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
