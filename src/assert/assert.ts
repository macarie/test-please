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

export const is = <AssertionType>(
  value: AssertionType,
  expected: AssertionType,
  message?: string
) => {
  const satisfied = Object.is(value, expected)
  const diff: string = satisfied ? '' : compare(value, expected)

  assert(satisfied, 'is', diff, message, is)
}

export const equal = <AssertionType>(
  value: AssertionType,
  expected: AssertionType,
  message?: string
) => {
  const satisfied = dequal(value, expected)
  const diff: string = satisfied ? '' : compare(value, expected)

  assert(satisfied, 'equal', diff, message, equal)
}
