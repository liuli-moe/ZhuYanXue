import { AsyncArray } from '@liuli-util/async'
import { mkdirp, readdir, remove, stat } from '@liuli-util/fs-extra'
import * as path from 'path'
import { BookConfig, MarkdownBookBuilder } from '@liuli-util/mdbook'
import JSZip from 'jszip'
import { readFile, writeFile } from 'fs/promises'
import FastGlob from 'fast-glob'
import {
  fromMarkdown,
  getYamlMeta,
  setYamlMeta,
  toMarkdown,
} from '@liuli-util/markdown-util'
import { fileURLToPath } from 'url'
import { difference, sortBy, uniq } from 'lodash-es'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distPath = path.resolve(__dirname, '../dist')

async function clean() {
  await remove(distPath)
  await mkdirp(distPath)
}

async function bundle() {
  console.log('打包 zip 文件')
  const list = await FastGlob('*.epub', { cwd: distPath })
  const zip = new JSZip()
  await AsyncArray.forEach(list, async (name) => {
    zip.file(name, await readFile(path.resolve(distPath, name)))
  })
  await writeFile(
    path.resolve(distPath, 'books.zip'),
    await zip.generateAsync({ type: 'nodebuffer' }),
  )
}

async function scanSections(root: string) {
  const fsPath = path.resolve(root, 'README.md')
  const list = difference(sortBy(await readdir(root)), ['README.md'])
  const s = await readFile(fsPath, 'utf-8')
  const ast = fromMarkdown(s)
  setYamlMeta(ast, {
    ...getYamlMeta(ast),
    sections: list,
  })
  await writeFile(fsPath, toMarkdown(ast))
}

async function build() {
  const booksPath = path.resolve(__dirname, '../docs')
  const list = await AsyncArray.filter(
    await readdir(booksPath),
    async (name) => {
      return (
        (await stat(path.resolve(booksPath, name))).isDirectory() &&
        name !== '.vuepress'
      )
    },
  )
  const builder = new MarkdownBookBuilder()
  for (const name of list) {
    const entryPoint = path.resolve(booksPath, name, 'README.md')
    await scanSections(path.resolve(booksPath, name))
    const title = (
      getYamlMeta(
        fromMarkdown(await readFile(entryPoint, 'utf-8')),
      ) as BookConfig
    ).title
    console.log(`构建 [${title}]`)
    await writeFile(
      path.resolve(distPath, title + '.epub'),
      await builder.generate(entryPoint),
    )
  }
}

async function main() {
  await clean()
  await build()
  await bundle()
}

main()
