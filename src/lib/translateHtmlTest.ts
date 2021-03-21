import * as fs from 'fs'
import { translateHtml } from './TranslateHtml'

async function main() {
  const file = '/Users/mario/Desktop/Repository/epub-translate-private/fixtures/test.html'
  const content = fs.readFileSync(file, 'utf8')
  const transText = await translateHtml(content)

  fs.writeFileSync('/Users/mario/Desktop/Repository/epub-translate-private/fixtures/result_trans.html', transText)
}

// @ts-ignore
main()
