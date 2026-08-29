import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'Sign in · Motion-U Portals',
}

function errorFromParams(searchParams: URLSearchParams): string {
  switch (searchParams.get('error')) {
    case 'access_denied':
      return 'Sign in was cancelled or not allowed.'
    case 'invalid_state':
      return 'Sign in failed. Please try again.'
    case 'token_exchange_failed':
      return 'Could not complete sign in. Please try again.'
    case 'invalid_token':
      return 'Sign in verification failed. Please try again.'
    case 'forbidden_org':
      return 'Your account is not authorized to access this workspace.'
    default:
      return searchParams.get('error') ? 'Sign in failed. Please try again.' : ''
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const error = errorFromParams(new URLSearchParams(params as Record<string, string>))

  return (
    <body className="auth-body">
      <ThemeToggle floating />
      <main className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">M</span>
            <span className="auth-brand__name">
              Motion-U <span className="brand-sub">PORTALS</span>
            </span>
          </div>
          <h1 className="h-lg mt-4">Sign in to your account</h1>
          <p className="auth-sub">One card. Every department, event, and achievement.</p>

          <form className="auth-form">
            <p className="auth-hint">
              Sign in with your Zitadel account to view your profile and claim your card.
            </p>
            <a href="/api/auth/login" className="btn btn-primary btn-block">
              <i className="fa-solid fa-right-to-bracket" />
              Sign in with Zitadel
            </a>
            {error && <p className="auth-error">{error}</p>}
          </form>
        </div>
        <div className="auth-preview">
          <div className="public-card-frame" style={{ width: '100%' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Motion-U
            </div>
            <p className="text-faint" style={{ fontSize: '0.85rem', maxWidth: '26ch' }}>
              One digital credential for every member — tap in anywhere.
            </p>
          </div>
        </div>
      </main>
    </body>
  )
}
