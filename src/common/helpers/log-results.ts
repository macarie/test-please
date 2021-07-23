import { isMainThread, parentPort } from 'node:worker_threads'
import { relative } from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  bgGreen,
  bgRed,
  bgWhite,
  black,
  bold,
  dim,
  gray,
  green,
  red,
  underline,
  white,
  yellow,
} from 'kleur/colors'

import type { Except } from 'type-fest'
import type { Results } from '../types/results.js'

import { AssertionError } from '../../assert/helpers/assertion-error.js'
import { messages } from '../../assert/helpers/messages.js'
import { TestResult } from './test-result.js'
import { logStats } from './log-stats.js'

const okSymbol = green('•')
const skippedSymbol = yellow('~')
const failedSymbol = red('⨯')

export const logResults = ({
  file = '',
  results: { results, stats },
  shouldLogStats = false,
  suiteName,
  time,
  workingDirectory,
}: {
  file?: string
  results: Results
  shouldLogStats?: boolean
  suiteName: string
  time?: number
  workingDirectory?: string
}): void => {
  if (isMainThread) {
    if (!shouldLogStats) {
      console.log(underline(white(file)))
    }

    const bgResults =
      stats.passed + stats.skipped === stats.total ? bgGreen : bgRed
    const symbols = Array.from({ length: results.length })
    const errorsToLog: Error[] = []

    for (const [index, result] of results.entries()) {
      switch (result) {
        case TestResult.ok:
          symbols[index] = okSymbol

          break

        case TestResult.skipped:
          symbols[index] = skippedSymbol

          break

        default:
          symbols[index] = failedSymbol
          errorsToLog.push(result)

          break
      }
    }

    console.log(
      `${bgWhite(black(` ${suiteName} `))}${bgResults(
        white(` ${stats.passed}/${stats.total} `)
      )} ${symbols.join(' ')}\n`
    )

    for (const error of errorsToLog) {
      if (error.name === 'AssertionError[TestPlease]') {
        const assertionError = error as AssertionError
        const relativeFilePath = relative(
          workingDirectory ?? cwd(),
          fileURLToPath(/\w (.+?:\d+:\d+)/.exec(assertionError.stack!)![1])
        )

        console.log(
          `  ${bold(assertionError.testerTitle)}\n   ${dim(
            gray(`» ${relativeFilePath}`)
          )}\n\n  ${
            assertionError.message || messages[assertionError.assertion]
          }\n`
        )

        console.log(assertionError.diff)
      } else {
        console.error(error)
      }

      console.log()
    }

    if (shouldLogStats) {
      logStats({
        ...stats,
        time: time!,
      })
    }
  } else {
    parentPort!.postMessage({
      results: {
        results: results.map((result) => {
          if (result instanceof AssertionError) {
            const error: Except<Required<AssertionError>, 'setTesterTitle'> = {
              name: result.name,
              assertion: result.assertion,
              diff: result.diff,
              testerTitle: result.testerTitle,
              message: result.message,
              stack: result.stack!,
            }

            return error
          }

          return result
        }),
        stats,
      },
      suiteName,
    }) // eslint-disable-line unicorn/require-post-message-target-origin
  }
}
