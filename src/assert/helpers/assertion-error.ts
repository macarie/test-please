import type { Assertion } from '../types/assertion.js'
import type { Diff } from '../types/diff.js'

export class AssertionError extends Error {
  assertion: Assertion
  diff: Diff[][]
  testerTitle: string

  constructor({
    assertion,
    diff,
    message,
    stackTraceEnd,
  }: {
    assertion: Assertion
    diff: Diff[][]
    message?: string
    stackTraceEnd: Function // eslint-disable-line @typescript-eslint/ban-types
  }) {
    super(message)

    this.name = 'AssertionError[TestPlease]'
    this.assertion = assertion
    this.diff = diff
    this.testerTitle = 'Test'

    Error.captureStackTrace(this, stackTraceEnd)
  }

  setTesterTitle = (testerTitle: string) => {
    this.testerTitle = testerTitle
  }
}
