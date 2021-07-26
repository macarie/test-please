import type { InspectOptions } from 'node:util'

import { inspect } from 'node:util'

const inspectOptions: InspectOptions = {
  colors: true,
  depth: Number.POSITIVE_INFINITY,
  maxArrayLength: Number.POSITIVE_INFINITY,
  maxStringLength: Number.POSITIVE_INFINITY,
  sorted: true,
  compact: false,
}

export const format = (value: any): string => inspect(value, inspectOptions)
