'use client'

import { useState } from 'react'
import { ORG_ADDRESS_LINES, ORG_ADDRESS_SHORT, ORG_EIN, ORG_LEGAL_NAME } from '@/lib/org'

type Props = {
  /** 'dark' sits on #1A2E1A (footer); 'light' sits on bgSage / white (About). */
  tone: 'dark' | 'light'
  /** Center the block (About) instead of left-aligning it (footer). */
  align?: 'left' | 'center'
}

/**
 * Nonprofit registration line: legal name + 501(c)(3) status, then two reveal
 * chips — the physical address (city/state shown, street + ZIP revealed) and
 * the EIN (label shown, number revealed).
 *
 * Both values are always in the DOM (Google's crawler needs to read them) —
 * the chips only control how they are *shown*. Hover reveals on pointer
 * devices; focus reveals for keyboard users; a tap toggles on touch screens.
 */
export default function NonprofitDisclosure({ tone, align = 'left' }: Props) {
  return (
    <div
      className={`nonprofit-disclosure nonprofit-disclosure--${tone}`}
      style={{ textAlign: align, justifyContent: align === 'center' ? 'center' : 'flex-start' }}
    >
      <span className="nonprofit-disclosure__line">
        {ORG_LEGAL_NAME} is a registered 501(c)(3) nonprofit organization.
      </span>

      <address className="nonprofit-disclosure__address">
        <RevealChip
          label={ORG_ADDRESS_SHORT}
          // Label already says the city/state; reveal adds only street + ZIP.
          value={`${ORG_ADDRESS_LINES[0]} · ${ORG_ADDRESS_LINES[1].split(' ').pop()}`}
          revealWidth="32ch"
          showLabel="Show full address"
          hideLabel="Hide full address"
        />
      </address>

      <RevealChip label="EIN" value={ORG_EIN} revealWidth="10ch" showLabel="Show EIN" hideLabel="Hide EIN" />
    </div>
  )
}

function RevealChip({
  label,
  value,
  revealWidth,
  showLabel,
  hideLabel,
}: {
  label: string
  value: string
  revealWidth: string
  showLabel: string
  hideLabel: string
}) {
  const [pinned, setPinned] = useState(false)
  return (
    <button
      type="button"
      className={`reveal-chip${pinned ? ' reveal-chip--pinned' : ''}`}
      style={{ ['--reveal-width' as string]: revealWidth }}
      aria-expanded={pinned}
      aria-label={pinned ? hideLabel : showLabel}
      onClick={() => setPinned((p) => !p)}
    >
      <span className="reveal-chip__label">{label}</span>
      <span className="reveal-chip__value">{value}</span>
    </button>
  )
}
