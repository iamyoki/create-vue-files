#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as commands from '../src/commands.js'

const argv = hideBin(process.argv)

yargs(argv)
  // cvf: default command handle
  .usage('$0', 'Create vue commonly used files', {}, commands.handleUsage)
  .option('preset', {
    alias: 'p',
    desc: 'Use your previous preset',
    type: 'boolean'
  })
  // cvf create <type>: create explicit type
  .command(
    ['create <type>', 'generate', 'new'],
    'Create by specific type',
    y =>
      y.check(v => {
        if (v._.length > 1) {
          throw new Error(
            'Error: <type> Can only provide one type at one time.'
          )
        }
        return false
      }),
    v => console.log(v)
  )
  .alias('help', 'h')
  .alias('version', 'v')
  .locale('en').argv
