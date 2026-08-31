import type { Metadata } from 'next'
import Link from 'next/link'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import { APPLY_FORM_URL, APP_STORE_URL } from '@/lib/links'

export const metadata: Metadata = {
  title: 'Join the Team',
  description:
    'Apply to work on Bread Head. Semester-long positions in design, engineering, content, research, social, and partnerships. Open to high school and college students.',
  openGraph: {
    title: 'Join the Bread Head team',
    description:
      'Semester-long positions for driven high school and college students. Design, engineering, content, research, social, and partnerships.',
  },
}

// ── The seven open positions (source: team application form) ──────
const ROLES = [
  {
    number: '01',
    title: 'Graphic designer',
    fit: "Aesthetic, artistic, experienced in Canva and Adobe Photoshop, and you work well in a team.",
    tasks: ['Creating graphics', 'Supporting the team with digital visuals'],
  },
  {
    number: '02',
    title: 'UI/UX website and app developer',
    fit: 'Detail-oriented, good with functionality, and able to see things from multiple perspectives.',
    tasks: ['Reviewing UI/UX and functionality', 'Mocking up screens and flows', 'Flagging friction points'],
  },
  {
    number: '03',
    title: 'Technical website and app engineer',
    fit: 'Experienced with coding and shipping apps.',
    tasks: ['Building features on the iOS app and website', 'Fixing bugs', 'Reviewing code'],
  },
  {
    number: '04',
    title: 'Market researcher and social media',
    fit: "Online, tuned into what people watch, and comfortable writing scripts and captions.",
    tasks: ['Researching what works for similar accounts', 'Scripting content', 'Posting and tracking performance'],
  },
  {
    number: '05',
    title: 'Financial researcher and analyst',
    fit: 'Strong with numbers, comfortable in spreadsheets, and a clear writer.',
    tasks: ['Researching grants and sponsors', 'Helping write applications', 'Tracking our numbers and where money goes'],
  },
  {
    number: '06',
    title: 'Partnerships and development',
    fit: 'Outgoing, organized, and persistent.',
    tasks: ['Finding schools, nonprofits, and companies to work with', 'Drafting and sending outreach'],
  },
  {
    number: '07',
    title: 'Content researcher and writer',
    fit: 'Curious about personal finance and able to explain complicated things simply.',
    tasks: ['Writing lessons and quiz questions', 'Fact-checking what is in the app', 'Helping write scripts for social'],
  },
]

// ── How the positions work ────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    label: 'Term',
    title: 'One semester at a time',
    body: 'Positions run in fall, spring, and summer terms, so you can commit around school.',
  },
  {
    label: 'Renewal',
    title: 'Renew as long as you want',
    body: 'Every position is renewable. Plenty of the team has stayed on term after term.',
  },
  {
    label: 'Deadline',
    title: 'Applications close September 11',
    body: 'Get yours in before then. Once you submit, we reply with next steps within 2 to 3 business days.',
  },
]

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '15px',
  color: '#E6EDD9',
  background: '#4A5D4A',
  textDecoration: 'none',
  padding: '15px 30px',
  borderRadius: '100px',
  minHeight: '48px',
  boxSizing: 'border-box',
}

const secondaryBtn: React.CSSProperties = {
  ...primaryBtn,
  color: '#1A2E1A',
  background: '#FFFFFF',
  border: '1px solid rgba(26,46,26,0.18)',
}

const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '11px',
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: '#4A5D4A',
  margin: 0,
}

export default function ApplyPage() {
  return (
    <main>
      {/* ── §1 Hero — bgSage ───────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          className="apply-hero-inner"
          style={{ maxWidth: '1100px', margin: '0 auto', padding: '160px 24px 88px' }}
        >
          <FadeUp>
            {/* Applications-open badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#4A5D4A',
                background: 'rgba(74,93,74,0.10)',
                border: '1px solid rgba(74,93,74,0.28)',
                borderRadius: '100px',
                padding: '7px 15px',
                marginBottom: '24px',
              }}
            >
              7 roles · applications close Sept 11
            </span>

            <h1
              className="apply-hero-h1"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: '48px',
                lineHeight: 1.1,
                color: '#1A2E1A',
                margin: '0 0 24px',
                maxWidth: '760px',
              }}
            >
              Come help build Bread Head.
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '17px',
                lineHeight: 1.7,
                color: 'rgba(26,46,26,0.70)',
                maxWidth: '620px',
                margin: '0 0 20px',
              }}
            >
              We are a teen-built financial literacy 501(c)(3) nonprofit growing fast, and we are
              looking for driven young people to grow with us. Most of our team is in high school, some are in
              college, and every one of them ships real work that teens across the country use.
            </p>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '17px',
                lineHeight: 1.7,
                color: 'rgba(26,46,26,0.70)',
                maxWidth: '620px',
                margin: '0 0 32px',
              }}
            >
              Pick the position you feel most passionate about, or that lines up with your strengths
              and experience, and tell us why in the application.
            </p>

            {/* Disambiguation callout: this is a team application, not an app signup */}
            <div
              style={{
                background: '#FFFFFF',
                border: '0.5px solid rgba(26,46,26,0.14)',
                borderLeft: '3px solid #4A5D4A',
                borderRadius: '12px',
                padding: '18px 22px',
                maxWidth: '620px',
                marginBottom: '36px',
              }}
            >
              <p style={{ ...eyebrow, marginBottom: '8px' }}>Just so it is clear</p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: 'rgba(26,46,26,0.72)',
                  margin: 0,
                }}
              >
                This is an application to work on Bread Head, not a signup to use it. If you are a
                teen who wants to learn how money works, the app is free.{' '}
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4A5D4A', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Download it here
                </a>
                .
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <a href={APPLY_FORM_URL} target="_blank" rel="noopener noreferrer" style={primaryBtn}>
                Start your application →
              </a>
              <a href="#roles" style={secondaryBtn}>
                See the 7 roles
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── §2 How the positions work — white ──────────────────── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          className="apply-how-grid"
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '72px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px',
          }}
        >
          {HOW_IT_WORKS.map((item, i) => (
            <FadeUp key={item.label} delay={i * 0.06}>
              <div>
                <p style={{ ...eyebrow, marginBottom: '12px' }}>{item.label}</p>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '18px',
                    color: '#1A2E1A',
                    margin: '0 0 10px',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: 'rgba(26,46,26,0.65)',
                    margin: 0,
                  }}
                >
                  {item.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── §3 Roles — bgSage ──────────────────────────────────── */}
      <section id="roles" style={{ background: '#E6EDD9' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '88px 24px' }}>
          <FadeUp>
            <p style={{ ...eyebrow, marginBottom: '14px' }}>Open positions</p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(28px, 3.2vw, 42px)',
                lineHeight: 1.15,
                color: '#1A2E1A',
                margin: '0 0 12px',
              }}
            >
              Seven ways in.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: 1.7,
                color: 'rgba(26,46,26,0.65)',
                maxWidth: '580px',
                margin: '0 0 48px',
              }}
            >
              Apply to the one that fits you best. No prior job experience required, just show us
              what you can do and why you care.
            </p>
          </FadeUp>

          <div
            className="apply-roles-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
          >
            {ROLES.map((role, i) => (
              <FadeUp key={role.number} delay={Math.min(i, 4) * 0.05}>
                <div
                  className="card-border"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '32px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '13px',
                      letterSpacing: '0.06em',
                      color: 'rgba(26,46,26,0.28)',
                      margin: '0 0 10px',
                    }}
                  >
                    {role.number}
                  </p>

                  <h3
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '20px',
                      lineHeight: 1.3,
                      color: '#1A2E1A',
                      margin: '0 0 18px',
                    }}
                  >
                    {role.title}
                  </h3>

                  <p style={{ ...eyebrow, marginBottom: '8px' }}>Great if you are</p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '15px',
                      lineHeight: 1.7,
                      color: 'rgba(26,46,26,0.68)',
                      margin: '0 0 20px',
                    }}
                  >
                    {role.fit}
                  </p>

                  <p style={{ ...eyebrow, marginBottom: '10px' }}>Weekly tasks look like</p>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {role.tasks.map((t) => (
                      <li
                        key={t}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: 1.6,
                          color: 'rgba(26,46,26,0.68)',
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#4A5D4A',
                            marginTop: '8px',
                            flexShrink: 0,
                          }}
                        />
                        {t}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={APPLY_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 'auto',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#4A5D4A',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: '44px',
                    }}
                  >
                    Apply for this role →
                  </a>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── §4 Final CTA — dark ────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <FadeUp>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(28px, 3.4vw, 44px)',
                lineHeight: 1.15,
                color: '#D1A945',
                margin: '0 0 18px',
              }}
            >
              Ready when you are.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: 1.7,
                color: 'rgba(230,237,217,0.75)',
                margin: '0 auto 32px',
                maxWidth: '520px',
              }}
            >
              Applications close September 11. The application takes about ten minutes, we read
              every one, and you will hear back about next steps within 2 to 3 business days.
            </p>
            <a
              href={APPLY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...primaryBtn,
                background: '#D1A945',
                color: '#1A2E1A',
              }}
            >
              Start your application →
            </a>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: 1.7,
                color: 'rgba(230,237,217,0.55)',
                margin: '28px 0 0',
              }}
            >
              Questions before you apply?{' '}
              <Link href="/support" style={{ color: '#E6EDD9', fontWeight: 600, textDecoration: 'underline' }}>
                Get in touch
              </Link>
              .
            </p>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
