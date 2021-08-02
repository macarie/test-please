import batch from '@macarie/batch'
import { dim, cyan, green, yellow, red, white } from 'kleur/colors'

import type { Stats } from '../types/stats.js'

type LogArguments = [string, number, (input: string) => string]

const log = batch((args: LogArguments[]) => {
  const fillLength =
    Math.max(...args.map(([label]) => label.length)) + (args.length > 1 ? 1 : 0)

  for (const [label, data, color] of args) {
    const message = color(`${label.padEnd(fillLength, ' ')} ${data}`)

    console.log(data > 0 ? message : dim(message))
  }
}, 0)

const formatTime = (time: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: time > 10_000 ? 'second' : 'millisecond',
    unitDisplay: 'narrow',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(time)

const totalLabel = '  Total:'
const passedLabel = '  Passed:'
const skippedLabel = '  Skipped:'
const failedLabel = '  Failed:'
const doneInLabel = '  Done in'

export const logStats = ({ failed, skipped, passed, time, total }: Stats) => {
  console.log()

  log(totalLabel, total, white)
  log(passedLabel, passed, green)
  log(skippedLabel, skipped, yellow)
  log(failedLabel, failed, red)
  log.flush()

  console.log(dim(cyan(`\n${doneInLabel} ${formatTime(time)}`)))
}
