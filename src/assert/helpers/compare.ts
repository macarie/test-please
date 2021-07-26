import { diffWordsWithSpace, diffLines } from 'diff'
import { $, bold, dim, gray, green, red } from 'kleur/colors'

import { format } from './format.js'

$.enabled = true

const MINUS: string = red('  --- ')
const PLUS: string = green('  +++ ')
const ANSI_FIXED = '\u001B['

const hasNewLines = (string: string): boolean => /\r?\n/.test(string)
const cleanValue = (string: string): string =>
  string.replace(/\r/g, '').replace(/\n$/, '')

const compareLines = (value: string, expected: string): string => {
  const diff = diffLines(value, expected)

  let output = ''

  for (const change of diff) {
    if (change.added || change.removed) {
      const symbol = change.added ? PLUS : MINUS

      for (const line of cleanValue(change.value).split('\n')) {
        output += `${symbol}${bold(line)}\n`
      }
    } else {
      for (const line of dim(gray(cleanValue(change.value))).split('\n')) {
        output += `      ${line}\n`
      }
    }
  }

  return output
}

const compareStrings = (value: string, expected: string): string => {
  const diff = diffWordsWithSpace(value.toString(), expected.toString())

  let minus: string = MINUS
  let plus: string = PLUS
  let buffer = ''

  for (const change of diff) {
    if (change.added) {
      plus += bold(buffer + change.value)
      continue
    }

    if (change.removed) {
      minus += bold(buffer + change.value)
      continue
    }

    buffer = ''

    let cleanValue = change.value

    if (change.value.endsWith('\u001B[')) {
      // eslint-disable-next-line no-control-regex
      cleanValue = change.value.replace(/\u001B\[$/, '')
      buffer = ANSI_FIXED
    }

    plus += dim(cleanValue)
    minus += dim(cleanValue)
  }

  return `${minus}\n${plus}`
}

export const compare = <ValueT>(value: ValueT, expected: ValueT): string => {
  const actualFormatted = format(value)
  const expectedFormatted = format(expected)

  if (
    [actualFormatted, expectedFormatted].some((formattedValue) =>
      hasNewLines(formattedValue)
    )
  ) {
    return compareLines(actualFormatted, expectedFormatted)
  }

  return compareStrings(actualFormatted, expectedFormatted)
}
