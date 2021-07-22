import { dequal } from 'dequal'

import type { Assertion } from './types/assertion.js'
import type { Diff } from './types/diff.js'

import { AssertionError } from './helpers/assertion-error.js'
import { compare } from './helpers/compare.js'

const assert = (
  satisfied: boolean,
  assertion: Assertion,
  diff: Diff[][],
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

export const is = <AssertionType>(
  actual: AssertionType,
  expected: AssertionType,
  message?: string
) => {
  assert(
    Object.is(actual, expected),
    'is',
    compare(actual, expected),
    message,
    is
  )
}

export const equal = <AssertionType>(
  actual: AssertionType,
  expected: AssertionType,
  message?: string
) => {
  assert(
    dequal(actual, expected),
    'equal',
    compare(actual, expected),
    message,
    equal
  )
}
