import { JSDOM } from 'jsdom'
import { html2xhtml } from './html2xhtml'

function formatText(text) {
  const lines = text.split('\n')
  // lines = lines.map(x => x.trim())
  text = lines.join('')
  return text
}

function isValidText(text) {
  const patt = /^\s+$/g
  const result = text.match(patt)
  return !result || result.length === 0
}

export function enumTextNodes(dom, root) {
  const textNodes = []

  const iter = dom.window.document.createNodeIterator(root, dom.window.NodeFilter.SHOW_TEXT)
  let textnode = iter.nextNode()
  while (textnode) {
    textNodes.push(textnode)
    textnode = iter.nextNode()
  }
  return textNodes
}

export function cloneHtmlStructure(html: string): string {
  const dom = new JSDOM(html)
  const root = dom.window.document.querySelector('body')

  // 1.枚举dom，找到所有包含 text 的节点{textNodes}
  const textNodes = enumTextNodes(dom, root)

  // 2.对{textNodes}中每个text对应的parentElement(A),向上遍历直到root，如果遇到{stopNode}中的类型的节点B则停止，将B加到表{clone}，如果遇不到，将(A)加到{toCloneElements}中。
  let toCloneElements = []
  const StopNames = ['h', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span', 'div']
  textNodes.forEach((x) => {
    const elem = x.parentElement
    if (isValidText(x.nodeValue)) {
      if (elem && StopNames.includes(elem.nodeName.toLowerCase())) {
        toCloneElements.push(elem)
      }
    }
  })

  // 3. 去重。
  toCloneElements = [...new Set(toCloneElements)]
  // 4. 再检查下是否有元素互相包含，有则去重
  const checkedMap = new Map()

  toCloneElements.forEach((e) => {
    checkedMap.set(e, { remove: false })
  })
  for (const parent of checkedMap.keys()) {
    if (!checkedMap.get(parent).remove) {
      const toRemove = []
      toCloneElements.forEach((e) => {
        if (parent !== e && parent.contains(e)) {  // if k is ancestor of e
          toRemove.push(e)
        }
      })
      toRemove.forEach((e) => {
        checkedMap.set(e, { remove: true })
        const index = toCloneElements.indexOf(e)
        if (index !== -1) {
          toCloneElements.splice(index, 1)
        }
      })
    }
  }
  // 5.对cloneNode中每个element，克隆插入到后面
  const clonedElems = []
  toCloneElements.forEach((e) => {
    const clone = e.cloneNode(true)
    // insert clone after e
    e.parentNode.insertBefore(clone, e.nextSibling)
    clonedElems.push(clone)
  })

  // 6.对于每个{clonedElems}中的element(A),再次枚举其所有text，对每个text 对应的parentElement(B) 直到 (A)，做标记. 从(A)开始递归遍历element，将所有没被标记的element删除
  const classTag = 'dst_trans_name'
  clonedElems.forEach((cloneRoot) => {
    const textnodes = enumTextNodes(dom, cloneRoot)
    textnodes.forEach((textnode) => {
      textnode.nodeValue = formatText(textnode.nodeValue)
      let e = textnode.parentElement
      e.classList.add(classTag)
      while (e !== cloneRoot) {
        e.classList.add(classTag)
        e = e.parentElement
      }
    })

    function removeChildWithoutClass(parent) {
      const toRemove = []
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i]
        if (!child.classList.contains(classTag)) {
          toRemove.push(child)
        } else {
          removeChildWithoutClass(child)
        }
      }
      toRemove.forEach((x) => {
        x.parentNode.removeChild(x)
      })
    }

    removeChildWithoutClass(cloneRoot)

    if (cloneRoot.nodeName.toLowerCase() === 'p') {
      cloneRoot.textContent = formatText(cloneRoot.textContent)  // 把p中的所有text合并到p上
    }
  })
  const dst = dom.serialize()
  const xhtml = html2xhtml(dst)
  return xhtml

}
