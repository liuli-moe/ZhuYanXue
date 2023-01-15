import { AsyncArray } from '@liuli-util/async'
import { readdir, readFile, writeFile } from 'fs/promises'
import { difference, sortBy, uniq } from 'lodash-es'
import path from 'path'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'
import { fromMarkdown, getYamlMeta } from '@liuli-util/markdown-util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function genrateSidebar(root: string) {
  const list = sortBy(
    difference(await readdir(root), ['.vuepress', 'README.md']),
  )
  const sidebar = (
    await AsyncArray.map(list, async (name) => {
      const list = uniq([
        'README.md',
        ...(await readdir(path.resolve(root, name))).sort((a, b) =>
          a.localeCompare(b),
        ),
      ])
      return {
        [`/${name}/`]: list,
      }
    })
  ).reduce((r, v) => ({ ...r, ...v }), {})
  return sidebar
}

async function genrateNavbar(root: string) {
  const list = sortBy(await fg('./*/README.md', { cwd: root }))
  const r = await AsyncArray.map(list, async (name) => {
    const s = await readFile(path.resolve(root, name), 'utf-8')
    const meta = getYamlMeta(fromMarkdown(s)) as { title: string }
    return {
      text: meta.title,
      link: `/${name.slice(0, 2)}/`,
    }
  })
  return r
}

// console.log(await genrateSidebar(path.resolve(__dirname, '../docs')))
// console.log(await genNavbar(path.resolve(__dirname, '../docs')))

async function generate() {
  const root = path.resolve(__dirname, '../docs')
  const [navbar, sidebar] = await Promise.all([
    genrateNavbar(root),
    genrateSidebar(root),
  ])
  const fsPath = path.resolve(root, '.vuepress/data.json')
  await writeFile(fsPath, JSON.stringify({ navbar, sidebar }, null, 2))
}

generate()
