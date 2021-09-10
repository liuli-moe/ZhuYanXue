const glob = require('glob')
const path = require('path')

/**
 * 扫描目录自动生成 sider 配置列表
 * @param {string} dir 要扫描的目录，仅会扫描一层
 * @param {string} title 扫描目录下 `index.md` 的标题，由于目前并没有解析 md，所以需要手动指定它
 * @returns
 */
function scanSidebar(dir) {
  return glob
    .sync('*.md', {
      cwd: path.join(__dirname, '..', dir),
    })
    .map((filename) => {
      const name = path.basename(filename)
      return path.posix.join(dir, name)
    })
}

/**
 *
 * @param {number} n
 * @param {number} len
 */
function format(n, len) {
  const diff = len - n.toString().length
  if (diff < 0) {
    return n
  }
  return '0'.repeat(diff) + n
}

function genNavbar() {
  return [
    '第一部 洁梅',
    '第二部 夜莲',
    '第三部 芙蓉',
    '第四部 红棉',
    '第五部 紫玫',
    '第六部 苍兰',
    '第七部 雪芍',
    '第八部 海棠',
    '第九部 丹杏',
    '第十部 百合',
    '第十一部 清菊',
  ].map((s, i) => ({
    text: s,
    link: `/${format(i + 1, 2)}/`,
  }))
}

module.exports = {
  scanSidebar,
  genNavbar,
}

// console.log(genNavbar()[0].link)
// console.log(
//   genNavbar().reduce((res, item) => {
//     res[item.link] = scanSidebar(item.link)
//     return res
//   }, {}),
// )
