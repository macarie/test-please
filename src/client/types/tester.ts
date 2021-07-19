import type { VoidPromise } from './void-promise.js'

export type Tester<Context> = (context: Context) => VoidPromise
