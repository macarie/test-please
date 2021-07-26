import { readFileSync } from 'node:fs'

export const getLines = (
  file: string,
  line: number
): Array<[number, string]> => {
  const fileContents = readFileSync(file, 'utf8')
  const lines = fileContents.split('\n')

  const output: Array<[number, string]> = []

  const start = Math.max(0, line - 2)
  const end = Math.min(lines.length, line + 1)

  for (let i = start; i < end; i += 1) {
    output.push([i + 1, lines[i]])
  }

  return output
}
