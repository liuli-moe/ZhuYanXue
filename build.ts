import { AsyncArray } from '@liuli-util/async'
import { mkdirp, readdir, remove, stat } from 'fs-extra'
import * as path from 'path'
import { BookConfig, MarkdownBookBuilder } from '@liuli-util/mdbook'
import matter from 'gray-matter'
import JSZip from 'jszip'
import { readFile, writeFile } from 'fs/promises'
import FastGlob from 'fast-glob'

const distPath = path.resolve(__dirname, './dist')

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

async function build() {
  const booksPath = path.resolve(__dirname, './docs')
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
    console.log(`构建 [${name}]`)
    const entryPoint = path.resolve(booksPath, name, 'README.md')
    const title = (matter(await readFile(entryPoint)).data as BookConfig).title
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
