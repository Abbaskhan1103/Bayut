import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  // No Origin header = same-origin browser request or server-to-server call — allow
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF: reject cross-origin mutating requests on API routes.
  // Stripe webhook is excluded — it comes from Stripe's servers, not a browser.
  if (
    pathname.startsWith("/api/") &&
    pathname !== "/api/stripe-webhook" &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    !isValidOrigin(request)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only run Supabase session refresh for page routes (not API routes)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Defence-in-depth: redirect unauthenticated users away from protected routes.
  // Individual layouts also enforce this with richer checks (role, subscription status).
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/admin/:path*", "/login"],
};
