import type { InspectOptions } from 'node:util'

import { inspect } from 'node:util'

import { diffWordsWithSpace, diffLines } from 'diff'
import { $, bold, dim, gray, green, red } from 'kleur/colors'

$.enabled = true

const MINUS: string = red(' --- ')
const PLUS: string = green(' +++ ')

const hasNewLines = (string: string): boolean => /\r?\n/.test(string)
const cleanValue = (string: string): string =>
  string.replace(/\r/g, '').replace(/\n$/, '')

const compareLines = (
  actual: string,
  expected: string
): string => {
  const diff = diffLines(actual, expected)

  let output = ''

  for (const change of diff) {
    if (change.added || change.removed) {
      const symbol = change.added ? PLUS : MINUS

      for (const line of cleanValue(change.value).split('\n')) {
        output += `${symbol}${bold(line)}\n`
      }
    } else {
      for (const line of dim(gray(cleanValue(change.value))).split('\n')) {
        output += `     ${line}\n`
      }
    }
  }

  return output
}

const compareStrings = (
  actual: string,
  expected: string
): string => {
  const diff = diffWordsWithSpace(actual.toString(), expected.toString())

  let minus: string = MINUS
  let plus: string = PLUS
  for (const change of diff) {
    if (change.added) {
      plus += bold(change.value)
    } else if (change.removed) {
      minus += bold(change.value)
    } else {
      plus += dim(change.value)
      minus += dim(change.value)
    }
  }

  return `${minus}\n${plus}`
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
): string => {
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
