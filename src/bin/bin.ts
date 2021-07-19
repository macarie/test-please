#!/usr/bin/env node

import { cwd } from 'node:process'

import sade from 'sade'

import { exec } from '../runner/runner.js'

sade('test-please [tests]')
  .option('-C, --cwd', 'The current directory to resolve from', cwd())
  .action(async (tests, options) => {
    try {
      await exec({
        tests: Array.isArray(tests) ? tests : [tests],
        workingDirectory: options.cwd,
      })
    } catch {
      process.exit(1)
    }
  })
  .parse(process.argv)
