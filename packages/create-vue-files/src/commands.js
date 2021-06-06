import inquirer from 'inquirer'
import signale from 'signale'
import { configstore } from './configstore.js'
import { createComponent } from './createFiles.js'

// Task types
const types = [
  'Component',
  'Router',
  'Route',
  'normalize.css',
  'Vuex',
  'Vuex-State',
  'Vuex-Getters',
  'Vuex-Mutations',
  'Vuex-Actions',
  'Vuex-Modules'
]

// cvf [--preset]
async function handleUsage(v) {
  const preset = configstore.get('preset.component')

  const ans = await inquirer.prompt({
    type: 'list',
    name: 'type',
    message: 'Select one type of files to create:',
    choices: types,
    loop: false
  })

  const task = {
    Component() {
      // Use preset
      if (v.preset) {
        if (!preset) return signale.error(`No preset of component found.`)
        createComponent(preset)
      } else {
        // Not use preset
        createComponent()
      }
    }
  }[ans.type]

  if (task) await task()
}

export { handleUsage }
