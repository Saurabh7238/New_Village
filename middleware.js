import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  isMainAdminOnlyApi,
  isMainAdminOnlyPage,
  isServiceChangeRoute,
} from "@/lib/serviceChangePolicy";

export default withAuth(
  function middleware(req) {
    const { pathname, origin } = req.nextUrl;
    const role = req.nextauth.token?.role;
    const isApiRequest = pathname.startsWith("/api/");

    if (isApiRequest && role === "subadmin") {
      if (isMainAdminOnlyApi(pathname)) {
        return NextResponse.json({ message: "Main admin access required." }, { status: 403 });
      }

      if (isServiceChangeRoute(pathname, req.method)) {
        const headers = new Headers(req.headers);
        headers.set("x-service-change-path", `${pathname}${req.nextUrl.search}`);
        return NextResponse.rewrite(new URL("/api/admin/service-change-submit", origin), {
          request: { headers },
        });
      }

      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      if (role === "admin") return NextResponse.next();
      if (role === "subadmin" && !isMainAdminOnlyPage(pathname)) return NextResponse.next();
      return NextResponse.redirect(new URL("/denied", origin));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => Boolean(token) || req.nextUrl.pathname.startsWith("/api/"),
    },
  }
);

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/dashboard/:path*", "/denied"],
};
