import { red, green } from 'kleur/colors'
import type { Assertion } from '../types/assertion.js'

const plus = green('+')
const minus = red('-')

export const messages: Record<Assertion, string> = {
  is: `Expected \`actual\` (${minus}) to be strictly equal to \`expected\` (${plus}):`,
  equal: `Expected \`actual\` (${minus}) to deeply equal \`expected\` (${plus}):`,
}
