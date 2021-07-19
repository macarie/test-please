import type { Hook } from './hook.js'

export interface Hooks<Context> {
  before: Hook<Context>
  after: Hook<Context>
}
