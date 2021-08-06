import { suite } from 'test-please'
import { is, does } from 'test-please/assert'
import stripAnsi from 'strip-ansi'

import { is as $is, does as $does } from '../../src/assert/assert.js'
import { AssertionError } from '../../src/assert/helpers/assertion-error.js'

const checkError =
  (
    assertion: string,
    message: string,
    testerTitle: string,
    diffChecker: (diff: string) => boolean
  ) =>
  (error: unknown) => {
    const assertionError = error as AssertionError

    is(assertionError instanceof AssertionError).true()
    is(assertionError.assertion, assertion)
    is(assertionError.message, message)
    is(assertionError.testerTitle, testerTitle)
    is(diffChecker(assertionError.diff)).true()

    return true
  }

const diffChecker =
  (expectedDiff: string) =>
  (actualDiff: string): boolean =>
    expectedDiff === stripAnsi(actualDiff)
const logError = (error: unknown) => {
  console.log(error)
}

// Testing AssertionError
const assertionErrorTests = suite('AssertionError')

assertionErrorTests('`AssertionError` should expose its options', () => {
  const assertion = 'is'
  const message = 'Custom error message'
  const diff = '  --- test\n  +++ tests'
  const testerTitle = 'Custom tester title'

  const error = new AssertionError({
    assertion,
    diff,
    message,
    stackTraceEnd: checkError,
  })

  error.setTesterTitle(testerTitle)

  checkError(assertion, message, testerTitle, diffChecker(diff))(error)
})

void assertionErrorTests.run()

// Testing is(x, y)
const isTests = suite('is(x, y)')

isTests('`is(x, y)` should be a function', () => {
  is(typeof $is, 'function')
})

isTests('`is(x, y)` should not throw if valid', async () => {
  // Number
  await does(() => {
    $is(1, 1)
  }).not.throw()

  // Boolean
  await does(() => {
    $is(true, true)
  }).not.throw()

  // String
  await does(() => {
    $is('a', 'a')
  }).not.throw()

  // Object
  const o = {}
  await does(() => {
    $is(o, o)
  }).not.throw()

  // Array
  const a = []
  await does(() => {
    $is(a, a)
  }).not.throw()

  // Symbol
  const s = Symbol('symbol')
  await does(() => {
    $is(s, s)
  }).not.throw()

  // Null
  await does(() => {
    $is(null, null)
  }).not.throw()

  // Undefined
  await does(() => {
    $is(undefined, undefined)
  }).not.throw()

  // BigInt
  const b1 = BigInt('0x1fffffffffffff')
  const b2 = BigInt('0x1fffffffffffff')
  await does(() => {
    $is(b1, b2)
  }).not.throw()

  // NaN
  await does(() => {
    $is(Number.NaN, Number.NaN)
  }).not.throw()
})

isTests('`is(x, y)` should throw if invalid', () => {
  try {
    $is(true, false)
  } catch (error: unknown) {
    checkError('is', '', 'Test', diffChecker('  --- true\n  +++ false'))(error)
  }
})

isTests(
  '`is(x, y)` should display a helpful message if trying to compare objects',
  () => {
    try {
      $is({}, [])
    } catch {
      checkError(
        'is',
        'It appears that `value` and `expected` are not strictly equal.',
        'Test',
        diffChecker(
          '  At a glance, `expected` is an array; usually, this type is compared to other values using `assert.equal`.'
        )
      )
    }

    try {
      $is({}, [])
    } catch {
      checkError(
        'is',
        'It appears that `value` and `expected` are not strictly equal.',
        'Test',
        diffChecker(
          '  At a glance, `expected` is an object; usually, this type is compared to other values using `assert.equal`.'
        )
      )
    }
  }
)

isTests('`is(x, y)` should throw with a custom message if passed', () => {
  try {
    $is(true, false, 'Custom message')
  } catch (error: unknown) {
    checkError(
      'is',
      'Custom message',
      'Test',
      diffChecker('  --- true\n  +++ false')
    )(error)
  }
})

void isTests.run()
