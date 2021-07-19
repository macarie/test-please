import type { Hooks } from './hooks.js'
import type { Tester } from './tester.js'
import type { VoidPromise } from './void-promise.js'

export interface Suite<Context> {
  (testName: string, tester: Tester<Context>): void

  before: {
    (hook: Hooks<Context>['before']['suite']): void
    each: (hook: Hooks<Context>['before']['test']) => void
  }
  after: {
    (hook: Hooks<Context>['after']['suite']): void
    each: (hook: Hooks<Context>['after']['test']) => void
  }

  only: (testName: string, tester: Tester<Context>) => VoidPromise
  skip: (testName: string, tester: Tester<Context>) => VoidPromise

  run: () => Promise<void>
}
