import { AsyncArray } from '@liuli-util/async'
import { mkdirp, readdir, remove, stat } from 'fs-extra'
import * as path from 'path'
import { exec, ExecOptions } from 'child_process'

function execPromise(
  command: string,
  options?: ExecOptions,
): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
}

async function clean() {
  const distPath = path.resolve(__dirname, '../dist')
  await remove(distPath)
  await mkdirp(distPath)
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
  for (const name of list) {
    console.log(`构建 [${name}]`)
    await execPromise('npx mdbook build -o ../../dist', {
      cwd: path.resolve(booksPath, name),
    })
  }
}

async function main() {
  await clean()
  await build()
}

main()
