import type { Tester } from '../types/tester.js'
import type { Results } from '../../common/types/results'

import { AssertionError } from '../../assert/helpers/assertion-error.js'
import { TestResult } from '../../common/helpers/test-result.js'
import { getTesterTitle } from './tester-title.js'
import { noop } from './noop.js'

export const parallel = async <Context>({
  promises,
  context,
}: {
  promises: Array<Tester<Context>>
  context: Context
}): Promise<Results> => {
  const results: Results = {
    results: Array.from({ length: promises.length }),
    stats: {
      total: promises.length,
      passed: 0,
      failed: 0,
      skipped: 0,
    },
  }

  await Promise.all(
    promises.map(async (promise, index) => {
      if (promise === noop) {
        results.results[index] = TestResult.skipped
        results.stats.skipped += 1

        return
      }

      try {
        await promise(context)

        results.results[index] = TestResult.ok
        results.stats.passed += 1
      } catch (error: unknown) {
        if (error instanceof AssertionError) {
          error.setTesterTitle(getTesterTitle(promise))
        }

        results.results[index] = error as Error
        results.stats.failed += 1
      }
    })
  )

  return results
}
