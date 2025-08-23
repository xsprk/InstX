import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const pass = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
    if (pass !== process.env.ADMIN_KEY) {
      return new NextResponse("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "admin" } });
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*"] };
