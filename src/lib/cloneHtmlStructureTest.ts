import * as fs from 'fs'
import { cloneHtmlStructure } from './cloneHtmlStructure'

const file = '/Users/mario/Desktop/Repository/epub-translate-private/fixtures/test.html'
const content = fs.readFileSync(file, 'utf8')
const result = cloneHtmlStructure(content)

fs.writeFileSync('/Users/mario/Desktop/Repository/epub-translate-private/fixtures/result.html', result)
