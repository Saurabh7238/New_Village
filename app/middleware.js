import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname, origin } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(`${origin}/denied`);
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/denied"],
};
