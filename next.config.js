/** @type {import('next').NextConfig} */
const csp = [
  "default-src 'self'",
  // gstatic/google needed by Firebase Auth: gapi (apis.google.com), reCAPTCHA (www.google.com/www.gstatic.com)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com",
  // Google/Apple sign-in popups + reCAPTCHA challenge iframe (www.google.com) + gapi iframe (apis.google.com)
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com https://www.google.com https://appleid.apple.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
