import * as inquirer from 'inquirer'
import * as inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt'
import { Environment } from './utils'
import { selectTask } from './tasks'

async function bootstrap() {
  console.clear()

  inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt)

  await Environment.loadTokens()
  await selectTask()
}

bootstrap()
