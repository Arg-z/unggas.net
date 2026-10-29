import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Jaring pengaman kedua (Next.js 16: proxy, pengganti middleware).
 * Halaman yang wajib login dicek keberadaan cookie sesi di sini; validasi
 * penuh (termasuk isAdmin) tetap di guard tiap page/action server-side.
 * Cookie di lapisan ini hanya dicek ada/tidak — token tidak divalidasi di sini.
 */
const BUTUH_LOGIN = ["/admin", "/baru", "/notifikasi"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lindungi = BUTUH_LOGIN.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!lindungi) return NextResponse.next();
  if (!request.cookies.get("unggas_session")?.value) {
    return NextResponse.redirect(new URL("/masuk", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/baru/:path*", "/notifikasi/:path*"],
};
