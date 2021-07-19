import type { VoidPromise } from './void-promise.js'

export interface Hook<Context> {
  suite: (context: Context) => VoidPromise
  test: (context: Context) => VoidPromise
}
