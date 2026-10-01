// Legal / registration details for Bread Head, the 501(c)(3).
//
// Google for Nonprofits (Workspace) requires the site to DISPLAY the official
// Charity ID (IRS EIN) and a verified physical street address. Both render in
// the site footer (every page) and on /about, and are emitted as JSON-LD
// (schema.org NGO) from the root layout so crawlers can read them too.
//
// The address is the founder's home (there is no office), so the UI shows only
// city + state by default and puts the street + ZIP behind the same hover /
// tap reveal as the EIN. It is still in the HTML — "obscure", not hidden.
// Keep it in sync with the address on file with TechSoup: Google verifies
// against that record.

export const ORG_LEGAL_NAME = 'Bread Head'

/** IRS Employer Identification Number. */
export const ORG_EIN = '42-4509386'

/** Physical street address, one line per array entry: [street, "City, ST ZIP"]. */
export const ORG_ADDRESS_LINES: readonly [string, string] = [
  '5630 Pineview Ln N',
  'Plymouth, MN 55442',
]

/** What the page shows before the address chip is revealed. */
export const ORG_ADDRESS_SHORT = 'Plymouth, MN'
