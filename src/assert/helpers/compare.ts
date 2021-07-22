import type { InspectOptions } from 'node:util'

import { inspect } from 'node:util'

import { diffWordsWithSpace, diffLines } from 'diff'
import type { Diff } from '../types/diff.js'

const MINUS: Diff = { value: ' --- ', color: 'red' }
const PLUS: Diff = { value: ' +++ ', color: 'green' }

const hasNewLines = (string: string): boolean => /\r?\n/.test(string)
const cleanValue = (string: string): string =>
  string.replace(/\r/g, '').replace(/\n$/, '')

const compareLines = <AssertionType extends string>(
  actual: AssertionType,
  expected: AssertionType
): Diff[][] => {
  const diff = diffLines(actual, expected)

  const output: Diff[][] = []

  for (const change of diff) {
    if (change.added || change.removed) {
      const symbol = change.added ? PLUS : MINUS
      const modifiers: Partial<Diff> = change.added
        ? { color: 'green', modifier: 'bold' }
        : { color: 'red', modifier: 'bold' }

      for (const line of cleanValue(change.value).split('\n')) {
        output.push([symbol, { value: line, ...modifiers }])
      }
    } else {
      for (const line of cleanValue(change.value).split('\n')) {
        output.push([
          {
            value: `     ${line}`,
            color: 'gray',
            modifier: 'dim',
          },
        ])
      }
    }
  }

  return output
}

const compareStrings = <AssertionType extends string>(
  actual: AssertionType,
  expected: AssertionType
): Diff[][] => {
  const diff = diffWordsWithSpace(actual.toString(), expected.toString())

  const minus: Diff[] = [MINUS]
  const plus: Diff[] = [PLUS]
  for (const change of diff) {
    if (change.added) {
      plus.push({ value: change.value, modifier: 'bold' })
    } else if (change.removed) {
      minus.push({ value: change.value, modifier: 'bold' })
    } else {
      plus.push({ value: change.value, modifier: 'dim' })
      minus.push({ value: change.value, modifier: 'dim' })
    }
  }

  return [minus, plus]
}

const inspectOptions: InspectOptions = {
  colors: true,
  depth: Number.POSITIVE_INFINITY,
  maxArrayLength: Number.POSITIVE_INFINITY,
  maxStringLength: Number.POSITIVE_INFINITY,
  sorted: true,
  compact: false,
}

export const compare = <AssertionType>(
  actual: AssertionType,
  expected: AssertionType
): Diff[][] => {
  const actualFormatted = inspect(actual, inspectOptions)
  const expectedFormatted = inspect(expected, inspectOptions)

  if (
    [actualFormatted, expectedFormatted].some((formattedValue) =>
      hasNewLines(formattedValue)
    )
  ) {
    return compareLines(actualFormatted, expectedFormatted)
  }

  return compareStrings(actualFormatted, expectedFormatted)
}
