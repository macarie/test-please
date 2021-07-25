import { red, green, bold } from 'kleur/colors'

import type { Assertion } from '../types/assertion.js'

import { format } from './format.js'

const plus = green('+++')
const minus = red('---')

export const messages: Record<Assertion, string> = {
  is: `It appears that \`value\` (${minus}) and \`expected\` (${plus}) are not ${bold(
    'strictly'
  )} equal:`,
  equal: `It seems that \`value\` (${minus}) and \`expected\` (${plus}) are not ${bold(
    'deeply'
  )} equal:`,
  truthy: `By the looks of it, it's impossible to convert \`value\` to ${format(
    true
  )}:`,
  falsy: `By the looks of it, it's impossible to convert \`value\` to ${format(
    false
  )}:`,
  'is:not': `To go by appearances, \`value\` and \`expected\` are ${bold(
    'strictly'
  )} equal. Both are:`,
  'not:equal': `To all intents and purposes, \`value\` and \`expected\` are ${bold(
    'deeply'
  )} equal. Both are:`,
}
