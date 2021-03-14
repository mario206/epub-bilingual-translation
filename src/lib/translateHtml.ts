import * as cloneHtmlStructure from './cloneHtmlStructure'
import { TranslateInfo } from './translateInfo'

import { JSDOM } from 'jsdom'
import { html2xhtml } from './html2xhtml'
import { translateAll } from './TencentTranslateService'


export async function translateHtml(htmlSrc: string): Promise<any> {
  // 1.枚举dom，找到所有包含 text 的节点{textNodes}
  const transformSrc = cloneHtmlStructure.cloneHtmlStructure(htmlSrc)
  const dom = new JSDOM(transformSrc)
  const root = dom.window.document.querySelector('body')
  const textNodes = cloneHtmlStructure.enumTextNodes(dom, root)

  const arr: TranslateInfo[] = new Array()

  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < textNodes.length; ++i) {
    const node = textNodes[i]
    if (node.parentElement.classList.contains('dst_trans_name')) {
      const t = new TranslateInfo()
      t.textNode = node
      t.src = node.nodeValue
      arr.push(t)
    }
  }

  await translateAll(arr)

  arr.forEach(info => {
    info.textNode.nodeValue = info.dst
  })

  const dst = dom.serialize()
  const xhtml = html2xhtml(dst)
  return xhtml
}
