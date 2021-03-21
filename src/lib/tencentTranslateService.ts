// Depends on tencentcloud-sdk-nodejs version 4.0.3 or higher
import { TranslateInfo } from './translateInfo'
// tslint:disable-next-line:no-var-requires
const tencentcloud = require('tencentcloud-sdk-nodejs')

const TmtClient = tencentcloud.tmt.v20180321.Client
import * as cldrSegmentation from 'cldr-segmentation'
import { clientConfig } from './tencentClientConfig'


const client = new TmtClient(clientConfig)

const map = {}
const QPS = 5
const MAX_LENGTH = 2000
const TEST_REQ = false

function checkReqLimit(): Promise<any> {
  return new Promise((resolve) => {
    if (TEST_REQ) {
      return resolve()
    }
    // @ts-ignore
    const timestamp = parseInt(new Date().getTime() / 1000, 10)
    if (map[timestamp] === undefined) {
      map[timestamp] = 0
    }
    map[timestamp]++
    if (map[timestamp] >= QPS) {
      setTimeout(async () => {
        await checkReqLimit()
        resolve()
      }, 1000)
    } else {
      resolve()
    }
  })

}

let length = 0

export async function reqTranslateBatch(texts: string[]) {
  await checkReqLimit()
  const params = {
    'Source': 'auto',
    'Target': 'zh',
    'ProjectId': 0,
    'SourceTextList': texts,
  }

  let result = []

  if (TEST_REQ) {
    texts.forEach(str => length += str.length)
    console.log('length = ' + length)
    texts.forEach(str => result.push('##' + str + '##'))
    return result
  }

  await client.TextTranslateBatch(params).then(
    (data) => {
      console.log(data)
      if (data.TargetTextList.length !== texts.length) {
        console.error(`data.TargetTextList.length ${data.TargetTextList.length} != texts.length ${texts.length}`)
      }
      result = data.TargetTextList
    },
    (err) => {
      console.error('error', err)
    },
  )
  while (result.length < texts.length) {
    result.push('')
  }
  return result
}

export async function translateAll(infos: TranslateInfo[]) {
  await checkReqLimit()

  // 预处理下
  const lineInfoArr = []
  const lineIndexArr = []

  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < infos.length; ++i) {
    const info = infos[i]
    if (info.src.length <= MAX_LENGTH) {
      lineInfoArr.push(info.src)
      lineIndexArr.push(i)
    } else {
      const sentences = cldrSegmentation.sentenceSplit(info.src, cldrSegmentation.suppressions.en)
      sentences.forEach((x) => {
        if (x.length <= MAX_LENGTH) {
          lineInfoArr.push(x)
          lineIndexArr.push(i)
        } else {
          // 分割完还超过MAX_LENGTH
          console.error('[sentence too long]' + x)
        }
      })
    }
  }


  let currIndex = 0
  while (true) {
    let currLength = 0
    const textList = []
    const textIndex = []

    for (let j = currIndex; j < lineInfoArr.length; ++j) {
      if (currLength + lineInfoArr[j].length < MAX_LENGTH) {
        textIndex.push(j)
        textList.push(lineInfoArr[j])
        currLength += lineInfoArr[j].length
        currIndex = j + 1
        continue
      } else {
        currIndex = j
        break
      }
    }

    console.log(`translateAll length ${currIndex}/${lineInfoArr.length}`)

    const targets = await reqTranslateBatch(textList)

    for (let k = 0; k < targets.length; ++k) {
      const index = lineIndexArr[textIndex[k]]
      infos[index].dst += targets[k]
    }
    if (currIndex >= infos.length) {
      break
    }
  }
}

