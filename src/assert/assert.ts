import { dequal } from 'dequal'

import type { Assertion } from './types/assertion.js'

import { AssertionError } from './helpers/assertion-error.js'
import { compare } from './helpers/compare.js'
import { messages } from './helpers/messages.js'
import { format } from './helpers/format.js'

type StackTraceEnd = typeof equal | typeof is | typeof truthy | typeof falsy

const indent = (string: string): string =>
  string
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
const formatted = {
  false: format(false),
  true: format(true),
}

const assert = (
  satisfied: boolean,
  assertion: Assertion,
  diff: string,
  message: string | undefined,
  stackTraceEnd: StackTraceEnd
) => {
  if (satisfied) {
    return
  }

  throw new AssertionError({
    assertion,
    diff,
    message,
    stackTraceEnd,
  })
}

const compareValues = <ValueT>(
  satisfied: boolean,
  value: ValueT,
  expected: ValueT
): string => {
  if (satisfied) {
    return ''
  }

  return compare(value, expected)
}

export const is = <ValueT>(
  value: ValueT,
  expected: ValueT,
  message?: string
) => {
  const satisfied = Object.is(value, expected)

  let diff: string

  if (
    Array.isArray(expected) ||
    (expected !== null && typeof expected === 'object')
  ) {
    message = messages.is.replace(/\(.*?\) /g, '').replace(':', '.')
    diff = `  At a glance, \`expected\` is an ${
      Array.isArray(expected) ? 'array' : 'object'
    }; usually, this type is compared to other values using \`assert.equal\`.`
  } else {
    diff = compareValues(satisfied, value, expected)
  }

  assert(satisfied, 'is', diff, message, is)
}

export const equal = <ValueT>(
  value: ValueT,
  expected: ValueT,
  message?: string
) => {
  const satisfied = dequal(value, expected)
  const diff: string = compareValues(satisfied, value, expected)

  assert(satisfied, 'equal', diff, message, equal)
}

export const truthy = <ValueT>(value: ValueT, message?: string) => {
  // eslint-disable-next-line eqeqeq
  const satisfied = (value as unknown) == true
  const diff = `  ${format(value)} converts to ${formatted.false}.`

  assert(satisfied, 'truthy', diff, message, truthy)
}

export const falsy = (value: any, message?: string) => {
  // eslint-disable-next-line eqeqeq
  const satisfied = value == false
  const diff = `  ${format(value)} converts to ${formatted.true}.`

  assert(satisfied, 'falsy', diff, message, falsy)
}

is.not = <ValueT>(value: ValueT, expected: ValueT, message?: string) => {
  const satisfied = !Object.is(value, expected)
  const diff: string = indent(format(value))

  assert(satisfied, 'is:not', diff, message, is.not)
}

export const not = {
  equal: <ValueT>(value: ValueT, expected: ValueT, message?: string) => {
    const satisfied = !dequal(value, expected)
    const diff: string = indent(format(value))

    assert(satisfied, 'not:equal', diff, message, not.equal)
  },
}
