import { performance } from 'node:perf_hooks'

import type { Results } from '../common/types/results.js'

import { logResults } from '../common/helpers/log-results.js'

import type { Hooks } from './types/hooks.js'
import type { Suite } from './types/suite.js'
import type { Tester } from './types/tester.js'

import { noop } from './helpers/noop.js'
import { parallel } from './helpers/parallel.js'
import { serial } from './helpers/serial.js'
import { setTesterTitle } from './helpers/tester-title.js'

export const suite = <Context extends Record<string, unknown>>(
  suiteName: string
): Suite<Context> => {
  const context: Context = {} as unknown as Context

  const allTesters: Array<Tester<Context>> = []
  const onlyTesters: Array<Tester<Context>> = []

  const hooks: Hooks<Context> = {
    before: {
      suite: noop,
      test: noop,
    },
    after: {
      suite: noop,
      test: noop,
    },
  }

  const test: Suite<Context> = (
    title: string,
    tester: Tester<Context>
  ): void => {
    setTesterTitle(tester, title)

    allTesters.push(tester)
    onlyTesters.push(noop)
  }

  const before: Suite<Context>['before'] = (hook) => {
    hooks.before.suite = hook
  }

  before.each = (hook) => {
    hooks.before.test = hook
  }

  const after: Suite<Context>['after'] = (hook) => {
    hooks.after.suite = hook
  }

  after.each = (hook) => {
    hooks.after.test = hook
  }

  test.before = before

  test.after = after

  test.only = (title: string, tester: Tester<Context>): void => {
    setTesterTitle(tester, title)

    onlyTesters.push(tester)
  }

  test.skip = (_title: string, _tester: Tester<Context>): void => {
    allTesters.push(noop)
    onlyTesters.push(noop)
  }

  test.run = async () => {
    const startTime = performance.now()

    let results: Results

    const testers: Array<Tester<Context>> = onlyTesters.some(
      (tester) => tester !== noop
    )
      ? onlyTesters
      : allTesters

    await Promise.resolve(hooks.before.suite(context))

    if ([hooks.before.test, hooks.after.test].some((hook) => hook !== noop)) {
      results = await serial({
        promises: testers,
        context,
        beforeEach: hooks.before.test,
        afterEach: hooks.after.test,
      })
    } else {
      results = await parallel({
        promises: testers,
        context,
      })
    }

    await Promise.resolve(hooks.after.suite(context))

    const endTime = performance.now()

    logResults({
      results,
      suiteName,
      shouldLogStats: true,
      time: endTime - startTime,
    })
  }

  return test
}

export const test = suite('')
