'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body
        style={{
          backgroundColor: '#E6EDD9',
          color: '#1A2E1A',
          fontFamily: 'DM Sans, sans-serif',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem',
            margin: '0 1.5rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              color: '#4A5D4A',
              marginBottom: '0.75rem',
            }}
          >
            Critical Error
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontStyle: 'italic',
              color: '#1A2E1A',
              marginTop: 0,
              marginBottom: '0.75rem',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 500,
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: 'rgba(26,46,26,0.6)',
              fontSize: '14px',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            We encountered a critical error. Please reload the page or return home.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: '#4A5D4A',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: '#E6EDD9',
                color: '#1A2E1A',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                border: 'none',
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.75'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
