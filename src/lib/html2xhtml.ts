// tslint:disable-next-line:no-var-requires
const parser = require('parse5')
// tslint:disable-next-line:no-var-requires
const xmlserializer = require('xmlserializer')


export function html2xhtml(htmlString) {
  const dom = parser.parse(htmlString)
  return xmlserializer.serializeToString(dom)
}
