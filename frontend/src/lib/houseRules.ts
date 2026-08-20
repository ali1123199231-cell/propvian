/**
 * House-rule presentation, shared by the org site renderer and the property
 * booking page. It lived in only one of them, which is how the property page
 * kept telling guests "Quiet hours allowed" after the site page was fixed.
 */

export const RULE_LABELS: Record<string, string> = {
  SMOKING: 'Smoking', PARTIES: 'Parties / events', PETS: 'Pets',
  QUIET_HOURS: 'Quiet hours', CHILDREN: 'Children',
}

export const RULE_ICONS: Record<string, string> = {
  SMOKING: '🚬', PARTIES: '🎉', PETS: '🐾', QUIET_HOURS: '🌙', CHILDREN: '👶',
}

/*
 * Each rule needs its own wording. A generic "<label> allowed / not allowed"
 * produces "Quiet hours allowed", which says the opposite of what the host set:
 * quiet hours being on means they are enforced, not permitted.
 */
export const RULE_PHRASES: Record<string, { yes: string; no: string }> = {
  SMOKING:     { yes: 'Smoking allowed',          no: 'No smoking' },
  PARTIES:     { yes: 'Parties / events allowed', no: 'No parties or events' },
  PETS:        { yes: 'Pets welcome',             no: 'No pets' },
  QUIET_HOURS: { yes: 'Quiet hours apply',        no: 'No set quiet hours' },
  CHILDREN:    { yes: 'Children welcome',         no: 'Not suitable for children' },
}

export function ruleText(ruleKey: string, allowed: boolean, notes?: string): string {
  const phrase = RULE_PHRASES[ruleKey]
  const label = RULE_LABELS[ruleKey] ?? ruleKey.replace(/_/g, ' ')
  const base = phrase ? (allowed ? phrase.yes : phrase.no) : `${label}${allowed ? ' allowed' : ' not allowed'}`
  return notes ? `${base} (${notes})` : base
}
