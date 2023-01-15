import { AsyncArray } from '@liuli-util/async'
import { readdir, rename } from '@liuli-util/fs-extra'
import { fromMarkdown, Heading, select, Text } from '@liuli-util/markdown-util'
import { difference, groupBy, sortBy, uniq, uniqBy } from 'lodash-es'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { parseChineseNumber } from 'parse-chinese-number'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const a6 = [
  'OPENING',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'THE CODA',
]

function parseTitle(s: string) {
  if (s.endsWith('…')) {
    return a6.indexOf(s.slice(0, s.length - 1)) + 1
  }
  const a = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const n = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  if (s.split('').some((s) => a.includes(s))) {
    return parseChineseNumber(
      s
        .split('')
        .filter((s) => a.includes(s))
        .join(''),
    )!
  }
  return s
    .split('')
    .map((s) =>
      a.includes(s) ? parseChineseNumber(s) : n.includes(s) ? s : '',
    )
    .map((i) => (i === 10 ? 1 : i))
    .join('')
}

async function fix(rootPath: string) {
  const list = difference(await readdir(path.resolve(rootPath)), ['README.md'])
  const r = await AsyncArray.map(list, async (name) => {
    const s = await readFile(path.resolve(rootPath, name), 'utf-8')
    const root = fromMarkdown(s)
    const title = (
      (select('heading[depth=1]', root) as Heading).children[0] as Text
    ).value
    return {
      name,
      title,
      index: parseTitle(title).toString().padStart(3, '0'),
    }
  })
  if (uniqBy(r, (v) => v.index).length !== r.length) {
    console.error(
      Object.values(groupBy(r, (v) => v.index)).filter((v) => v.length > 1),
    )
    throw new Error('重复的序号 ' + path.basename(rootPath))
  }
  console.log(r)
  await AsyncArray.forEach(r, async (item) => {
    await rename(
      path.resolve(rootPath, item.name),
      path.resolve(rootPath, `_${item.index}.md`),
    )
  })
  await AsyncArray.forEach(r, async (item) => {
    await rename(
      path.resolve(rootPath, `_${item.index}.md`),
      path.resolve(rootPath, `${item.index}.md`),
    )
  })
}

// fix(path.resolve(__dirname, '../docs/03'))

// console.log(parseTitle('第十一章 痛失爱儿'))

async function main() {
  const root = path.resolve(__dirname, '../docs')
  const list = sortBy(
    difference(await readdir(root), ['.vuepress', 'README.md']),
  )
  await AsyncArray.forEach(list, (name) => fix(path.resolve(root, name)))
}

main()
