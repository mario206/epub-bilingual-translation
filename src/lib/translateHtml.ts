import * as cloneHtmlStructure from './cloneHtmlStructure'
import { TranslateInfo } from './translateInfo'

import { html2xhtml } from './html2xhtml'
import { translateAll } from './TencentTranslateService'


export async function translateHtml(htmlSrc: string) {
  // 1.枚举dom，找到所有包含 text 的节点{textNodes}
  const dom = cloneHtmlStructure.cloneHtmlStructure(htmlSrc)
  const root = dom.window.document.querySelector('body')
  const textNodes = cloneHtmlStructure.enumTextNodes(dom, root)

  // textNodes.forEach(n => console.log('[7]' + n.nodeValue))

  const arr: TranslateInfo[] = new Array()

  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < textNodes.length; ++i) {
    const node = textNodes[i]
    // @ts-ignore
    const outerhtml = node.parentElement.outerHTML
    if (node.parentElement.classList.contains('dst_trans_name')) {
      const t = new TranslateInfo()
      t.textNode = node
      t.src = node.nodeValue
      arr.push(t)
    }
  }

  await translateAll(arr)

  arr.forEach(info => {
    // console.log(info.textNode.nodeValue + '=>' + info.dst)
    info.textNode.nodeValue = info.dst
  })

  const dst = dom.serialize()
  const xhtml = html2xhtml(dst)
  return xhtml
}
