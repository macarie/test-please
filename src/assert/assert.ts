import type { ValueOf } from 'type-fest'

import { dequal } from 'dequal'

import type { Assertion } from './types/assertion.js'

import { AssertionError } from './helpers/assertion-error.js'
import { compare } from './helpers/compare.js'
import { messages } from './helpers/messages.js'
import { format } from './helpers/format.js'

const indent = (string: string): string =>
  string
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
const formatted = {
  false: format(false),
  true: format(true),
}

type PossibleAssertions =
  | ValueOf<IsAssertions<any>>
  | ValueOf<DoesFunction>
  | ValueOf<DoesString>

const assertionFailed = (
  assertion: Assertion,
  diff: string,
  message: string | undefined,
  stackTraceEnd: PossibleAssertions
) => {
  throw new AssertionError({
    assertion,
    diff,
    message,
    stackTraceEnd,
  })
}

type IsAssertions<ValueT> = {
  equalTo: (expected: ValueT, message?: string) => void
  truthy: (message?: string) => void
  true: (message?: string) => void
  falsy: (message?: string) => void
  false: (message?: string) => void
  not: {
    (expected: ValueT, message?: string): void
    equalTo: (expected: ValueT, message?: string) => void
  }
}

export function is<ValueT>(
  value: ValueT,
  expected: ValueT,
  message?: string
): void
export function is<ValueT>(value: ValueT): IsAssertions<ValueT>
export function is<ValueT>(value: ValueT, expected?: ValueT, message?: string) {
  // Assertion is(x, y, msg?)
  if (arguments.length >= 2) {
    const satisfied = Object.is(value, expected)

    if (satisfied) {
      return
    }

    let diff: string

    if (
      Array.isArray(expected) ||
      (expected !== null && typeof expected === 'object')
    ) {
      message ??= messages.is.replace(/\(.*?\) /g, '').replace(':', '.')
      diff = `  At a glance, \`expected\` is an ${
        Array.isArray(expected) ? 'array' : 'object'
      }; usually, this type is compared to other values using \`assert.equal\`.`
    } else {
      diff = compare(value, expected)
    }

    return assertionFailed('is', diff, message, is)
  }

  // Assertion is(x)[assertion](y, msg?)
  const not = function (value: ValueT, message?: string) {
    const satisfied = !Object.is(value, expected)

    if (satisfied) {
      return
    }

    const diff: string = indent(format(value))

    return assertionFailed('is:not', diff, message, assertions.not)
  }

  not.equalTo = function (expected: ValueT, message?: string) {
    const satisfied = !dequal(value, expected)

    if (satisfied) {
      return
    }

    const diff: string = indent(format(value))

    return assertionFailed('not:equal', diff, message, assertions.not.equalTo)
  }

  const assertions: IsAssertions<ValueT> = {
    equalTo(expected: ValueT, message?: string) {
      const satisfied = dequal(value, expected)

      if (satisfied) {
        return
      }

      const diff: string = compare(value, expected)

      return assertionFailed('equal', diff, message, assertions.equalTo)
    },
    truthy(message?: string) {
      // eslint-disable-next-line eqeqeq
      const satisfied = (value as unknown) == true

      if (satisfied) {
        return
      }

      const diff = `  ${format(value)} converts to ${formatted.false}.`

      return assertionFailed('truthy', diff, message, assertions.truthy)
    },
    true(message?: string) {
      const satisfied = (value as unknown) === true

      if (satisfied) {
        return
      }

      const diff = `  The received value is ${format(value)}.`

      return assertionFailed('true', diff, message, assertions.true)
    },
    falsy(message?: string) {
      // eslint-disable-next-line eqeqeq
      const satisfied = (value as unknown) == false

      if (satisfied) {
        return
      }

      const diff = `  ${format(value)} converts to ${formatted.true}.`

      return assertionFailed('falsy', diff, message, assertions.falsy)
    },
    false(message?: string) {
      const satisfied = (value as unknown) === false

      if (satisfied) {
        return
      }

      const diff = `  The received value is ${format(value)}.`

      return assertionFailed('false', diff, message, assertions.false)
    },
    not,
  }

  return assertions
}

export function unreachable(message?: string) {
  assertionFailed('unreachable', '', message, unreachable)
}

type DoesFunction = {
  throw: (
    expected?: string | RegExp | ((error: Error) => boolean),
    message?: string
  ) => Promise<void>
}

type DoesString = {
  match: (expected: string | RegExp, message?: string) => void
}

export function does(fn: () => Promise<void> | void): DoesFunction
export function does(value: string): DoesString
export function does(valueOrFn: string | (() => Promise<void> | void)) {
  if (typeof valueOrFn === 'function') {
    const doesFunction: DoesFunction = {
      async throw(
        expected?: string | RegExp | ((error: Error) => boolean),
        message?: string
      ) {
        try {
          await valueOrFn()
          unreachable(
            message ??
              'The function `fn` was supposed to throw an error, it looks like it did not.'
          )
        } catch (error: unknown) {
          try {
            if (error instanceof AssertionError) {
              throw error
            } else if (
              typeof expected === 'string' ||
              expected instanceof RegExp
            ) {
              does((error as Error).message).match(
                expected,
                message ??
                  `It looks like the error message does not contain or match \`expected\`:`
              )
            } else if (typeof expected === 'function') {
              is(expected(error as Error)).true(
                message ??
                  `The \`expected\` function should return ${formatted.true} if everything is okay.`
              )
            }
          } catch (error: unknown) {
            Error.captureStackTrace(error as Error, this.throw)

            throw error
          }
        }
      },
    }

    return doesFunction
  }

  const doesString: DoesString = {
    match(expected: string | RegExp, message?: string) {
      const satisfied: boolean =
        typeof expected === 'string'
          ? valueOrFn.includes(expected)
          : expected.test(valueOrFn)

      if (satisfied) {
        return
      }

      const diff = `  ${format(valueOrFn)} does not ${
        typeof expected === 'string' ? 'contain' : 'match'
      } ${format(expected)}.`

      return assertionFailed('match', diff, message, this.match)
    },
  }

  return doesString
}
