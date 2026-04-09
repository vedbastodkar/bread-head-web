import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Notice — Bread Head',
  description: 'Privacy Notice and Terms of Use for Bread Head.',
}

export default function PrivacyNoticePage() {
  const lastUpdated = 'April 9, 2026'

  return (
    <main
      style={{
        background: '#E6EDD9',
        minHeight: '100vh',
        paddingTop: '120px',
        paddingBottom: '100px',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 32px',
        }}
      >
        {/* Page header */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: '#4A5D4A',
            marginBottom: '16px',
          }}
        >
          Legal
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '40px',
            color: '#1A2E1A',
            marginBottom: '12px',
            lineHeight: 1.15,
          }}
        >
          Privacy Notice
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'rgba(26,46,26,0.45)',
            marginBottom: '56px',
          }}
        >
          Last updated: {lastUpdated}
        </p>

        <Divider />

        {/* Privacy Policy */}
        <Section title="1. Information We Collect">
          <p>
            Bread Head collects only the information necessary to operate the
            app and improve your experience. This includes:
          </p>
          <ul>
            <li>
              <strong>Account information</strong> — name and email address when
              you create an account or sign up for early access.
            </li>
            <li>
              <strong>Usage data</strong> — in-app activity such as lessons
              completed, journal entries, and budgeting inputs. This data is
              stored locally on your device and is not shared with third parties.
            </li>
            <li>
              <strong>Device information</strong> — operating system version and
              app version, used solely for debugging and compatibility.
            </li>
          </ul>
          <p>
            We do not collect financial account numbers, Social Security
            numbers, or any payment information.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>Information we collect is used to:</p>
          <ul>
            <li>Operate and improve the Bread Head app and website.</li>
            <li>Send transactional emails such as early access confirmations.</li>
            <li>Diagnose technical issues and ensure app stability.</li>
          </ul>
          <p>
            We do not sell, rent, or share your personal information with
            advertisers or data brokers.
          </p>
        </Section>

        <Section title="3. Data Retention">
          <p>
            Account information is retained for as long as your account is
            active. You may request deletion of your data at any time by
            emailing{' '}
            <a href="mailto:breadhead.org@gmail.com" style={{ color: '#4A5D4A' }}>
              breadhead.org@gmail.com
            </a>
            . We will process deletion requests within 30 days.
          </p>
        </Section>

        <Section title="4. Cookies and Tracking">
          <p>
            The Bread Head website uses no third-party analytics or advertising
            cookies. We do not track you across other websites.
          </p>
        </Section>

        <Section title="5. Children's Privacy">
          <p>
            Bread Head is designed for teenagers aged 13 and older. We do not
            knowingly collect personal information from children under 13. If
            you believe a child under 13 has provided us with personal
            information, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We use industry-standard practices to protect your data, including
            encrypted transmission (HTTPS) and access controls. No method of
            transmission over the internet is 100% secure; we cannot guarantee
            absolute security.
          </p>
        </Section>

        <Divider />

        {/* Terms of Use */}
        <h2
          id="terms"
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '32px',
            color: '#1A2E1A',
            marginTop: '56px',
            marginBottom: '40px',
            lineHeight: 1.2,
          }}
        >
          Terms of Use
        </h2>

        <Section title="7. Acceptance">
          <p>
            By accessing bread-head.org or using the Bread Head app, you agree
            to these Terms of Use. If you do not agree, please do not use our
            services.
          </p>
        </Section>

        <Section title="8. Use of Service">
          <p>
            Bread Head is provided for personal, educational, and
            non-commercial use only. You agree not to:
          </p>
          <ul>
            <li>Attempt to gain unauthorized access to any part of the service.</li>
            <li>Use the service to distribute spam or malicious content.</li>
            <li>
              Reproduce, redistribute, or resell any content from Bread Head
              without written permission.
            </li>
          </ul>
        </Section>

        <Section title="9. Educational Content Disclaimer">
          <p>
            Content provided by Bread Head is for general financial education
            only. It does not constitute financial, legal, or tax advice. Always
            consult a qualified professional for decisions specific to your
            situation.
          </p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            All content, design, and code on bread-head.org and within the
            Bread Head app is owned by Bread Head and protected by applicable
            copyright and intellectual property laws.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            Bread Head is provided "as is" without warranties of any kind. To
            the fullest extent permitted by law, Bread Head and its creators
            shall not be liable for any indirect, incidental, or consequential
            damages arising from your use of the service.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>
            We may update this Privacy Notice and Terms of Use periodically.
            When we do, we will revise the "Last updated" date at the top of
            this page. Continued use of Bread Head after changes constitutes
            acceptance of the updated terms.
          </p>
        </Section>

        <Divider />

        {/* Contact */}
        <div style={{ marginTop: '48px' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'rgba(26,46,26,0.65)',
              lineHeight: 1.7,
            }}
          >
            Questions about this notice? Reach us at{' '}
            <a
              href="mailto:breadhead.org@gmail.com"
              style={{ color: '#4A5D4A', textDecoration: 'underline' }}
            >
              breadhead.org@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}

function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid rgba(26,46,26,0.12)',
        margin: '0 0 48px',
      }}
    />
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h3
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '15px',
          color: '#1A2E1A',
          marginBottom: '12px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          color: 'rgba(26,46,26,0.65)',
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </div>
  )
}
