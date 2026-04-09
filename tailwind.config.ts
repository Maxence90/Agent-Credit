// Tailwind CSS 配置文件。
// 负责声明样式扫描范围以及项目视觉主题扩展。
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        sand: '#f5efe2',
        ember: '#d97706',
        tide: '#0f766e',
        frost: '#e0f2fe',
      },
      boxShadow: {
        panel: '0 24px 60px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
}

export default config