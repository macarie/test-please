#!/usr/bin/env node

import { cwd } from 'node:process'
import { resolve as resolvePath } from 'node:path'

import sade from 'sade'
import { totalist } from 'totalist'

import { exec } from '../runner/runner.js'

type CLIOptions = {
  cwd: string
}

const defaults = {
  dir: '.',
  patternWithDir: /\.m?js$/i,
  patternWithoutDir: /(^(tests?|__tests?__)[\\/].+|[-.](test|spec)?)\.js$/i,
  ignoredPaths: [/node_modules/i],
}

sade('test-please [dir] [pattern]')
  .option('-C, --cwd', 'The current directory to resolve from', cwd())
  .action(async (dir: string, pattern: string, options: CLIOptions) => {
    const dirToUse = dir || defaults.dir
    const patternToUse: RegExp = pattern
      ? new RegExp(pattern, 'i')
      : dir
      ? defaults.patternWithDir
      : defaults.patternWithoutDir

    const { ignoredPaths } = defaults

    const tests: string[] = []

    await totalist(resolvePath(options.cwd, dirToUse), (relativePath) => {
      if (
        !ignoredPaths.every((ignoredPath) => ignoredPath.test(relativePath)) &&
        patternToUse.test(relativePath)
      ) {
        tests.push(resolvePath(dirToUse, relativePath))
      }
    })

    try {
      await exec({
        tests,
        workingDirectory: options.cwd,
      })
    } catch {
      process.exit(1)
    }
  })
  .parse(process.argv)
