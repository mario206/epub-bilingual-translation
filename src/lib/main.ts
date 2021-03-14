import { parseEpub } from 'epub-modify'
import fs from 'mz/fs'
// @ts-ignore
import * as path from 'path'
import { translateEpub } from './translate-epub'

async function main() {
  // usage : node /lib/main.js [pathOfEpubFile]
  const file = process.argv[2]

  const buffer = await fs.readFile(file)
  const transBuffer = await translateEpub(buffer, {
    // unu
    from: 'en',
    to: 'zh-CN',
    tld: 'cn',
  })

  const info = path.parse(file)
  const filename = info.name + '_translated' + info.ext
  const savePath = path.join(info.dir, filename)
  fs.writeFile(savePath, transBuffer)

  const epub = await parseEpub(transBuffer)
  console.log(epub.metadata.title)

}

main()

