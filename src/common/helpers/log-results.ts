import { isMainThread, parentPort } from 'node:worker_threads'

import {
  bgGreen,
  bgRed,
  bgWhite,
  black,
  green,
  red,
  underline,
  white,
  yellow,
} from 'kleur/colors'

import type { Results } from '../types/results.js'

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
}: {
  file?: string
  results: Results
  shouldLogStats?: boolean
  suiteName: string
  time?: number
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
      console.error(error)
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
        results,
        stats,
      },
      suiteName,
    })
  }
}
