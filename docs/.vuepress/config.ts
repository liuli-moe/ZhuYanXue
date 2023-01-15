import { defineUserConfig, defaultTheme } from 'vuepress'
import { navbar, sidebar } from './data.json'

export default defineUserConfig({
  title: '朱颜血',
  /**
   * @type import('@vuepress/theme-default').DefaultThemeData
   */
  theme: defaultTheme({
    navbar: [
      {
        text: '小说',
        children: navbar,
      },
      {
        text: 'GitHub',
        link: 'https://github.com/liuli-moe/ZhuYanXue',
      },
    ],
    sidebar,
  }),
})
