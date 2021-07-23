import { dequal } from 'dequal'

import type { Assertion } from './types/assertion.js'

import { AssertionError } from './helpers/assertion-error.js'
import { compare } from './helpers/compare.js'

const assert = (
  satisfied: boolean,
  assertion: Assertion,
  diff: string,
  message: string | undefined,
  stackTraceEnd: Function // eslint-disable-line @typescript-eslint/ban-types
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
  const diff: string = compareValues(satisfied, value, expected)

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
  const satisfied = Boolean(value)
  const diff: string = compareValues(satisfied, satisfied, true)

  assert(satisfied, 'truthy', diff, message, truthy)
}
