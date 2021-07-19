import type { TestResult } from '../helpers/test-result.js'

export interface Results {
  results: Array<TestResult | Error>
  stats: {
    total: number

    passed: number
    failed: number
    skipped: number
  }
}
