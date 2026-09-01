import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request)

  const { pathname } = request.nextUrl

  const isProtectedRoute =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/cards') ||
    pathname.startsWith('/members') ||
    pathname.startsWith('/membership') ||
    pathname.startsWith('/memberships')
  const isLoginRoute = pathname === '/login'

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/cards/:path*', '/members/:path*', '/membership/:path*', '/memberships/:path*', '/login'],
}
