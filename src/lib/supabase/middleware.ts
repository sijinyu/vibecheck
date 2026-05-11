import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth checks if Supabase is not configured (development without Supabase)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname === "/login";
  const isLanding = request.nextUrl.pathname === "/";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/");

  // Allow auth callback routes
  if (isAuthCallback) {
    return supabaseResponse;
  }

  // Logged in user trying to access login page → redirect to /analyze
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/analyze";
    return NextResponse.redirect(url);
  }

  // Not logged in and trying to access protected routes
  const protectedRoutes = ["/analyze", "/brand", "/dashboard", "/compare", "/influencer"];
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Not logged in on root → show landing (no redirect needed, landing is at /)
  // Logged in on root → redirect to /analyze
  if (user && isLanding) {
    const url = request.nextUrl.clone();
    url.pathname = "/analyze";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
