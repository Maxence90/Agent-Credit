'use client'

// 钱包状态 Hook。
// 负责封装浏览器钱包连接、Monad 网络检测、地址缩略显示和网络切换动作。

import { useMemo } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'

import {
  evaluateRealModeReadiness,
  getExplorerAddressUrl,
  getMonadChainConfig,
  isMonadChainId,
  shortenWalletAddress,
} from '@/lib/monad'

export type WalletConnectionState = 'connected' | 'connecting' | 'disconnected' | 'unsupported'

export function useWallet() {
  const chainConfig = getMonadChainConfig()
  const { address, chainId, isConnected } = useAccount()
  const {
    connectAsync,
    connectors,
    error: connectError,
    isPending: isConnecting,
  } = useConnect()
  const { disconnect } = useDisconnect()
  const {
    error: switchError,
    isPending: isSwitching,
    switchChainAsync,
  } = useSwitchChain()

  const injectedConnector = connectors.find((connector) => connector.id === 'injected') ?? connectors[0]
  const hasInjectedWallet = Boolean(injectedConnector)
  const isOnMonad = isMonadChainId(chainId)
  const walletStatus: WalletConnectionState = !hasInjectedWallet
    ? 'unsupported'
    : isConnecting
      ? 'connecting'
      : isConnected
        ? 'connected'
        : 'disconnected'

  const networkLabel = useMemo(() => {
    if (!isConnected) {
      return '未连接网络'
    }

    if (isOnMonad) {
      return chainConfig.chainName
    }

    return chainId ? `Chain ${chainId}` : '未知网络'
  }, [chainConfig.chainName, chainId, isConnected, isOnMonad])

  const realModeReadiness = evaluateRealModeReadiness(isConnected, isOnMonad)

  async function connectWallet(): Promise<void> {
    if (!injectedConnector) {
      throw new Error('未检测到可用的浏览器钱包，请先安装 MetaMask 或兼容钱包。')
    }

    await connectAsync({
      connector: injectedConnector,
    })
  }

  async function switchToMonad(): Promise<void> {
    if (!switchChainAsync) {
      throw new Error('当前钱包不支持自动切换网络，请手动切换到 Monad。')
    }

    await switchChainAsync({
      chainId: chainConfig.chainId,
    })
  }

  function disconnectWallet(): void {
    disconnect()
  }

  return {
    address,
    addressUrl: getExplorerAddressUrl(address),
    chainId,
    connectError: connectError?.message,
    connectWallet,
    disconnectWallet,
    hasInjectedWallet,
    isConnected,
    isOnMonad,
    isSwitching,
    networkLabel,
    realModeReadiness,
    shortAddress: shortenWalletAddress(address),
    switchError: switchError?.message,
    switchToMonad,
    walletStatus,
  }
}