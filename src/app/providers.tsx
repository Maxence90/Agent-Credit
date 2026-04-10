'use client'

// 全局 Provider 文件。
// 负责挂载 wagmi 与 React Query，为 Day 3 的钱包连接和网络检测提供上下文。

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider, createConfig, http, injected } from 'wagmi'

import { getMonadChain } from '@/lib/monad'

const monadChain = getMonadChain()

const wagmiConfig = createConfig({
  chains: [monadChain],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  ssr: true,
  transports: {
    [monadChain.id]: http(monadChain.rpcUrls.default.http[0]),
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}