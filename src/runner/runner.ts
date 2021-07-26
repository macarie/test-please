import { Worker } from 'node:worker_threads'
import { resolve as resolvePath, relative as relativePath } from 'node:path'
import { performance } from 'node:perf_hooks'
import { cwd } from 'node:process'
import type { Results } from '../common/types/results.js'

import { logResults } from '../common/helpers/log-results.js'
import { logStats } from '../common/helpers/log-stats.js'
import type { Options } from './types/options.js'

const runTest = async (
  test: Options['tests'][0],
  {
    workingDirectory,
  }: {
    workingDirectory: string
  }
): Promise<Results['stats']> =>
  new Promise((resolve) => {
    const worker = new Worker(test)
    const stats: Results['stats'] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    }

    worker.on(
      'message',
      ({ results, suiteName }: { results: Results; suiteName: string }) => {
        stats.total += results.stats.total
        stats.passed += results.stats.passed
        stats.failed += results.stats.failed
        stats.skipped += results.stats.skipped

        logResults({
          file: relativePath(workingDirectory, test),
          shouldLogStats: false,
          results,
          suiteName,
          workingDirectory,
        })
      }
    )

    worker.on('error', (...args) => {
      console.log(args)
      resolve(stats)
    })

    worker.on('exit', () => {
      resolve(stats)
    })
  })

export const exec = async ({
  workingDirectory = cwd(),
  tests,
}: Options): Promise<void> => {
  const startTime = performance.now()

  const results: Array<Results['stats']> = await Promise.all(
    tests.map(async (test) =>
      runTest(resolvePath(workingDirectory, test), {
        workingDirectory,
      })
    )
  )

  const endTime = performance.now()

  // eslint-disable-next-line unicorn/no-array-reduce
  const stats: Results['stats'] = results.reduce(
    (totalStats, currentStats) => {
      totalStats.total += currentStats.total
      totalStats.passed += currentStats.passed
      totalStats.failed += currentStats.failed
      totalStats.skipped += currentStats.skipped

      return totalStats
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    }
  )

  logStats({
    ...stats,
    time: endTime - startTime,
  })
}
