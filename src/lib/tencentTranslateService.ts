// Depends on tencentcloud-sdk-nodejs version 4.0.3 or higher
import { TranslateInfo } from './translateInfo'
// tslint:disable-next-line:no-var-requires
const tencentcloud = require('tencentcloud-sdk-nodejs')

const TmtClient = tencentcloud.tmt.v20180321.Client
import { clientConfig } from './tencentClientConfig'


const client = new TmtClient(clientConfig)

const map = {}
const QPS = 5
const MAX_LENGTH = 2000

function checkReqLimit(): Promise<any> {
  return new Promise((resolve) => {
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

export async function reqTranslate(sourceText: string): Promise<any> {
  await checkReqLimit()

  console.log('[reqTencentTranslate]' + sourceText)

  const lists = await reqTranslateBatch([sourceText])

  return lists.length > 0 ? lists[0] : ''
}


export async function reqTranslateBatch(texts: string[]): Promise<any> {
  await checkReqLimit()

  const params = {
    'Source': 'auto',
    'Target': 'zh',
    'ProjectId': 0,
    'SourceTextList': texts,
  }

  let result = []

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
  if (infos.length > 0) {
    let currIndex = 0
    while (true) {
      let currLength = 0
      const textList = []
      const textIndex = []

      for (let j = currIndex; j < infos.length; ++j) {
        const info = infos[j]
        if (info.src.length > MAX_LENGTH) {
          // todo 分割超过 2000 字的段落
          console.error('info.src.length > 2000')
          console.log(info.src)
          currIndex = j + 1
          continue
        }

        if (currLength + info.src.length < MAX_LENGTH) {
          textIndex.push(j)
          textList.push(info.src)
          currLength += info.src.length
          currIndex = j + 1
          continue
        } else {
          currIndex = j + 1
          break
        }
      }

      console.log(`reqTranslateBatch length ${currIndex}/${infos.length}`)
      await reqTranslateBatch(textList).then((targets: string[]) => {
        for (let k = 0; k < targets.length; ++k) {
          if (k < textList.length) {
            infos[textIndex[k]].dst = targets[k]
          }
        }
      }, () => {
        //
      })

      if (currIndex >= infos.length) {
        break
      }
    }
  }
}



