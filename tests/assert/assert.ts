import { suite } from 'test-please'
import { is, does, unreachable } from 'test-please/assert'
import stripAnsi from 'strip-ansi'

import { is as $is } from '../../src/assert/assert.js'
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

    unreachable()
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

// Testing is(x).equalTo(y)
const isEqual = suite('is(x).equalTo(y)')

isEqual('`is(x).equalTo(y)` should be a function', () => {
  is(typeof $is(0).equalTo, 'function')
})

isEqual('`is(x).equalTo(y)` shuold not throw if valid', async () => {
  // Number
  await does(() => {
    $is(1).equalTo(1)
  }).not.throw()

  // Boolean
  await does(() => {
    $is(true).equalTo(true)
  }).not.throw()

  // String
  await does(() => {
    $is('a').equalTo('a')
  }).not.throw()

  // Object
  const o = { foo: [1, 2, 3] }
  await does(() => {
    $is(o).equalTo(o)
    $is(o).equalTo({ foo: [1, 2, 3] })
  }).not.throw()

  // Array
  const a = [1, 2, 3]
  await does(() => {
    $is(a).equalTo(a)
    $is(a).equalTo([1, 2, 3])
  }).not.throw()

  // Symbol
  const s = Symbol('symbol')
  await does(() => {
    $is(s).equalTo(s)
  }).not.throw()

  // Null
  await does(() => {
    $is(null).equalTo(null)
  }).not.throw()

  // Undefined
  await does(() => {
    $is(undefined).equalTo(undefined)
  }).not.throw()

  // BigInt
  const b1 = BigInt('0x1fffffffffffff')
  const b2 = BigInt('0x1fffffffffffff')
  await does(() => {
    $is(b1).equalTo(b2)
  }).not.throw()

  // NaN
  await does(() => {
    $is(Number.NaN).equalTo(Number.NaN)
  }).not.throw()
})

isEqual('`is(x).equalTo(y)` should throw if invalid', () => {
  const input = {
    foo: [1, 2, 3],
  }

  try {
    $is(input).equalTo({ foo: [] })

    unreachable()
  } catch (error: unknown) {
    checkError(
      'equal',
      '',
      'Test',
      diffChecker(
        '      {\n  ---   foo: [\n  ---     1,\n  ---     2,\n  ---     3\n  ---   ]\n  +++   foo: []\n      }\n'
      )
    )(error)
  }
})

isEqual(
  '`is(x).equalTo(y)` should throw with a custom message if passed',
  () => {
    const input = {
      foo: [1],
    }

    try {
      $is(input).equalTo({ foo: [] }, 'Custom message')

      unreachable()
    } catch (error: unknown) {
      checkError(
        'equal',
        'Custom message',
        'Test',
        diffChecker(
          '      {\n  ---   foo: [\n  ---     1\n  ---   ]\n  +++   foo: []\n      }\n'
        )
      )(error)
    }
  }
)

void isEqual.run()
