// 应用根布局文件。
// 负责挂载全局样式、字体和页面元信息，是 App Router 的顶层入口。
import type { Metadata } from 'next'
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google'

import { Providers } from './providers'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Agent Credit',
  description: 'AI Agent credit payment demo for Monad.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-[family:var(--font-space-grotesk)] antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}