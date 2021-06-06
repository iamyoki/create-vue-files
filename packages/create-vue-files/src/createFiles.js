import chalk from 'chalk'
import fs from 'fs-extra'
import htmlTags from 'html-tags'
import selfClosingTags from 'html-tags/void.js'
import inquirer from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'
import ora from 'ora'
import { dirname, join } from 'path'
import pkgDir from 'pkg-dir'
import signale from 'signale'
import { fileURLToPath } from 'url'
import { configstore } from './configstore.js'

// Register inquirer plugins
inquirer.registerPrompt('autocomplete', autocomplete)

// Constants
const d = dirname(fileURLToPath(import.meta.url))
const cwd = process.cwd()

// Helpers
const sleep = timeout => new Promise(res => setTimeout(res, timeout))

// Mains

export async function createComponent(preset) {
  const rootDir = await pkgDir()

  const template = await fs.readFile(join(d, './templates/component.vue'), {
    encoding: 'utf-8'
  })

  const restQuestions = preset
    ? []
    : [
        {
          type: 'autocomplete',
          name: 'tag',
          prefix: '🪧',
          message: 'Input root html tag:',
          default: 'div',
          source: (answerSoFar, input) => {
            return htmlTags.filter(
              item =>
                item.search(input) === 0 && !selfClosingTags.includes(item)
            )
          }
        },
        {
          type: 'confirm',
          name: 'scoped',
          message: 'Should style scoped?',
          prefix: '🔒'
        },
        {
          type: 'confirm',
          name: 'useCSSprocesser',
          message: 'Use css processor?'
        },
        {
          type: 'list',
          name: 'lang',
          message: 'Use less or scss?',
          default: 'less',
          choices: ['less', 'scss'],
          prefix: '💅',
          when: ({ useCSSprocesser }) => useCSSprocesser
        },
        {
          type: 'confirm',
          name: 'save',
          default: false,
          message: 'Save this as a preset for future generations?',
          prefix: '💾'
        }
      ]

  const answer = await inquirer.prompt([
    {
      type: 'input',
      prefix: '📦',
      name: 'name',
      message: 'Input component name:',
      default: 'Button',
      filter: v => v.match(/\w+/)[0] // e.g. Button.vue -> Button
    },
    ...restQuestions
  ])

  if (preset) {
    delete preset?.name
    Object.assign(answer, preset)
    console.log(
      chalk.yellowBright(
        `Root html tag: ${answer.tag}
CSS processor: ${answer.lang}
Scoped: ${answer.scoped}`
      )
    )
  }

  const { name, scoped, lang, tag, save } = answer

  if (save && !preset) {
    configstore.set('preset', answer)
    signale.note(
      chalk.bgGreenBright.bold.black(
        `Saved your preset, next time use "--preset" option to reuse.`
      )
    )
  }

  // Inject template
  let content = template
    .replace(RegExp(`%name%`, 'g'), name)
    .replace(scoped !== undefined && RegExp(`%scoped%`, 'g'), 'scoped')
    .replace(lang !== undefined && RegExp(`%lang%`, 'g'), `lang='${lang}'`)
    .replace(tag !== undefined && RegExp(`%tag%`, 'g'), `${tag}`)

  const spinner = ora(`Writing component: ${name}.vue`)

  // Create in current src folder
  spinner.start()
  try {
    await fs.writeFile(
      join(rootDir, 'src', 'components', `${name}.vue`),
      content
    )
  } catch {
    // If src not exists, create in current folder
    spinner.stop()
    const { inCurrent } = await inquirer.prompt({
      type: 'confirm',
      name: 'inCurrent',
      message: `Directory 'src' is not found. Create component in current dir?`
    })

    if (!inCurrent) {
      return signale.warn('Process end.')
    }

    spinner.start()
    await fs.writeFile(join(rootDir, `${name}.vue`), content)
  }

  await sleep(400)
  spinner.stop()
  signale.success(`${name}.vue`)
}
