import * as fs from 'fs'
import { cloneHtmlStructure } from './cloneHtmlStructure'

const file = '/Users/mario/Desktop/epub-google-translate-master/fixtures/test.xhtml'
const content = fs.readFileSync(file, 'utf8')
const result = cloneHtmlStructure(content)

fs.writeFileSync('/Users/mario/Desktop/epub-google-translate-master/fixtures/result.xhtml', result)
