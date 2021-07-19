import type { Hook } from '../types/hook.js'
import type { Tester } from '../types/tester.js'
import type { Results } from '../../common/types/results.js'

import { TestResult } from '../../common/helpers/test-result.js'
import { noop } from './noop.js'

export const serial = async <Context>({
  promises,
  context,
  beforeEach = noop,
  afterEach = noop,
}: {
  promises: Array<Tester<Context>>
  context: Context
  beforeEach: Hook<Context>['test']
  afterEach: Hook<Context>['test']
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

  /* eslint-disable no-await-in-loop */
  for (const [index, promise] of promises.entries()) {
    if (promise === noop) {
      results.stats.skipped += 1

      continue
    }

    await beforeEach(context)

    try {
      await Promise.resolve(promise(context))

      results.results[index] = TestResult.ok
      results.stats.passed += 1
    } catch (error: unknown) {
      results.results[index] = error as Error
      results.stats.failed += 1
    }

    await afterEach(context)
  }
  /* eslint-enable no-await-in-loop */

  return results
}
