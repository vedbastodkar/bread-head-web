---
name: security-hardening
description: >
  Hardens application security across rate limiting, input validation, API key
  management, and OWASP best practices. Invoke when asked to secure an app,
  harden endpoints, audit security, fix vulnerabilities, add rate limiting,
  sanitize inputs, or handle API keys safely. Reviews existing code and makes
  targeted changes without breaking existing functionality.
---

# Security hardening

Review the codebase and apply the following security improvements in order.
Read each file before changing it. Add clear comments explaining every
security decision. Do not break existing functionality — if a change is
risky, note it and suggest it separately.

---

## 1. Rate limiting on public endpoints

Apply rate limiting to all public-facing routes. Use sensible, tiered defaults:

- **Auth endpoints** (login, register, password reset): 5 requests / 15 min per IP
- **API endpoints** (general): 100 requests / 15 min per IP + user ID combo
- **Static / read-only**: 300 requests / 15 min per IP

Implementation rules:
- Use both IP and authenticated user ID as composite keys where a user is logged in
- Return `429 Too Many Requests` with a JSON body: `{ "error": "Too many requests", "retryAfter": <seconds> }`
- Set headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Respond gracefully — never crash or expose stack traces on limit breach
- Use in-memory store (e.g. `express-rate-limit`) for single instances; recommend Redis (`rate-limit-redis`) for multi-instance deployments and add a comment flagging this

Example comment to include:
```js
// Rate limiting: 100 req/15min per IP+user. Increase limits or switch to
// Redis store if deploying multiple instances. See SECURITY.md.
```

---

## 2. Input validation and sanitization

Apply schema-based validation to every endpoint that accepts user input.

Rules:
- Use a schema library (Zod, Joi, Yup, or JSON Schema — match whatever is already in the project)
- Every field must declare: type, required/optional, min/max length, allowed format
- Reject unexpected fields (strip or error on unknown keys)
- Sanitize strings: trim whitespace, strip HTML/script tags unless the field explicitly needs HTML
- Validate numeric ranges, enum values, and date formats explicitly
- On validation failure: return `400 Bad Request` with field-level error messages — never expose internal schema details

Limits to apply unless the schema already specifies tighter values:
- String fields: max 255 chars (use 10 000 for free-text/body fields)
- Array fields: max 100 items
- Numeric IDs: must be positive integers
- Email: validate format, max 254 chars
- Passwords: min 8 chars, max 128 chars

Example comment to include:
```js
// Input validation: schema-based with strict unknown field rejection.
// All limits follow OWASP Input Validation Cheat Sheet recommendations.
```

---

## 3. Secure API key handling

Audit the entire codebase for hardcoded secrets and API keys.

Steps:
1. Search for patterns: strings matching `sk-`, `Bearer `, `api_key`, `apiKey`, `secret`, `password`, `token` assigned as literals
2. For every hardcoded key found:
   - Move it to an environment variable with a descriptive name (e.g. `STRIPE_SECRET_KEY`)
   - Replace the literal with `process.env.VARIABLE_NAME` (or the project's config pattern)
   - Add a check at startup that throws a clear error if the variable is missing
3. Ensure no secrets are passed to the client — audit any bundler config, `next.config.js`, or similar for variables that get exposed to the frontend. Only `NEXT_PUBLIC_` / `VITE_` prefixed vars should reach the client, and none of those should be secret
4. Add `.env.example` with placeholder values for every required variable if it doesn't exist
5. Verify `.env` and `.env.local` are in `.gitignore`

Example comment to include:
```js
// API keys loaded from environment variables only. Never commit real keys.
// Copy .env.example to .env and fill in values. Rotate keys if any were
// previously committed — check git history with: git log -S 'your-key'
```

---

## 4. OWASP best practices

Apply the following across the codebase:

### HTTP security headers
Set these on every response (use `helmet` for Express, or set manually):
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Error handling
- Never return stack traces, file paths, or internal error messages to the client
- Log full errors server-side; return only a generic message + request ID to the client
- Example: `{ "error": "Internal server error", "requestId": "abc123" }`

### SQL / NoSQL injection
- Confirm all queries use parameterised statements or an ORM — flag any raw string concatenation
- For MongoDB: ensure operators like `$where`, `$gt` cannot be injected via user input

### Authentication & session
- Verify JWTs are validated on every protected route — check signature, expiry, and issuer
- Ensure session cookies have `HttpOnly`, `Secure`, and `SameSite=Strict`
- Confirm password hashing uses bcrypt, argon2, or scrypt with appropriate cost factor (bcrypt ≥ 12)

### CORS
- Review CORS config — wildcard `*` is only acceptable for fully public read-only APIs
- For authenticated APIs: whitelist specific origins explicitly

---

## Output format

For each file changed, produce:

1. A brief summary of what was changed and why
2. The updated code with inline comments on every security addition
3. A note on anything that needs manual follow-up (e.g. rotating a key, enabling HTTPS, adding Redis)

At the end of the review, produce a short **Security summary** listing:
- Changes made
- Remaining risks to address
- Recommended next steps

---

## Constraints

- Do not break existing tests or functionality
- If a change requires a new dependency, call it out explicitly with the install command
- Prefer the libraries already in the project before adding new ones
- If unsure whether a change is safe, make it opt-in with a clear comment rather than applying it silently
