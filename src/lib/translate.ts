// @ts-ignore
import cheerio from 'cheerio'
import * as entities from 'entities'
import { reqTranslateBatch } from './TencentTranslateService'
import { translateHtml } from './TranslateHtml'

// @ts-ignore
async function transTexts(text, options) {
  const texts = Array.isArray(text) ? text : [text]

  // tslint:disable-next-line:prefer-for-of
  const transTextArr = await reqTranslateBatch(texts)

  return transTextArr
}

export async function translateOpf(xml, options) {
  const $ = cheerio.load(xml, { xmlMode: true, decodeEntities: false })

  const $nodes = $('dc\\:title, dc\\:description, title, description')

  const texts = $nodes.map((_, elem) => $(elem).text()).get()

  const trTexts = await transTexts(texts, options)

  $nodes.each((i, elem) => {
    const $elem = $(elem)

    const trText =
      elem.name === 'dc:description' || elem.name === 'description'
        ? entities.encode(trTexts[i])
        : trTexts[i]

    $elem.text(trText)
  })

  $('dc\\:language, language').text(options.to)

  return $.xml()
}

// @ts-ignore
export async function translateXhtml(text, options) {
  return translateHtml(await text)
}

export async function translateNcx(xml, options) {
  const $ = cheerio.load(xml, { xmlMode: true })
  const nodes = $('text')
  const texts = nodes.map((_, node) => $(node).text()).get()

  const transTextArr = await transTexts(texts, options)

  nodes.map((i, elem) => $(elem).text(transTextArr[i]))

  return $.xml()
}
