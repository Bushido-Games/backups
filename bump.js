const fs = require('node:fs')
const { version } = require('./package.json')

for (const packageName of fs.readdirSync('./packages/')) {
  const path = `./packages/${packageName}/package.json`

  const packageJson = require(path)

  packageJson.version = version

  fs.writeFileSync(path, JSON.stringify(packageJson, null, 2) + '\n')
}
