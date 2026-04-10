// Monad 支付辅助文件。
// 负责读取链配置、检测网络、辅助钱包展示，并为支付执行提供 simulated 或回退逻辑。
import { defineChain } from 'viem'

import type { CreditPaymentRequest, PaymentExecutionStatus, PaymentMode } from '@/lib/types'

const DEFAULT_MONAD_CHAIN_ID = 10143
const DEFAULT_MONAD_CHAIN_NAME = 'Monad Testnet'
const DEFAULT_MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz'
const DEFAULT_MONAD_EXPLORER_URL = 'https://testnet.monadexplorer.com'

export interface MonadChainConfig {
  chainId: number
  chainName: string
  rpcUrl: string
  explorerUrl: string
}

interface MonadExecutionBase {
  txStatus: PaymentExecutionStatus
  txHash?: string
  simulated: boolean
  mode: PaymentMode
  message: string
  executedAt: string
}

interface ExecuteMonadPaymentOptions {
  request: CreditPaymentRequest
  mode?: PaymentMode
}

export interface RealModeReadiness {
  ready: boolean
  reason: string
}

export function getMonadChainConfig(): MonadChainConfig {
  const chainId = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ?? DEFAULT_MONAD_CHAIN_ID)

  return {
    chainId: Number.isNaN(chainId) ? DEFAULT_MONAD_CHAIN_ID : chainId,
    chainName: process.env.NEXT_PUBLIC_MONAD_CHAIN_NAME ?? DEFAULT_MONAD_CHAIN_NAME,
    rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? DEFAULT_MONAD_RPC_URL,
    explorerUrl: process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ?? DEFAULT_MONAD_EXPLORER_URL,
  }
}

export function getMonadChain() {
  const config = getMonadChainConfig()

  return defineChain({
    id: config.chainId,
    name: config.chainName,
    network: 'monad',
    nativeCurrency: {
      decimals: 18,
      name: 'Monad',
      symbol: 'MON',
    },
    rpcUrls: {
      default: {
        http: [config.rpcUrl],
      },
      public: {
        http: [config.rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: `${config.chainName} Explorer`,
        url: config.explorerUrl,
      },
    },
  })
}

export function resolvePaymentMode(preferredMode?: PaymentMode): PaymentMode {
  const envMode = process.env.PAYMENT_MODE === 'real' ? 'real' : 'simulated'
  return preferredMode ?? envMode
}

export function createWagmiChainConfigInput() {
  const chain = getMonadChain()

  return {
    id: chain.id,
    name: chain.name,
    network: chain.network,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
    blockExplorers: chain.blockExplorers,
  }
}

export function createViemTransportUrl(): string {
  return getMonadChainConfig().rpcUrl
}

export function isMonadChainId(chainId?: number): boolean {
  return typeof chainId === 'number' && chainId === getMonadChainConfig().chainId
}

export function shortenWalletAddress(address?: string): string {
  if (!address) {
    return '未连接'
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getExplorerTransactionUrl(txHash?: string): string | undefined {
  if (!txHash) {
    return undefined
  }

  return `${getMonadChainConfig().explorerUrl}/tx/${txHash}`
}

export function getExplorerAddressUrl(address?: string): string | undefined {
  if (!address) {
    return undefined
  }

  return `${getMonadChainConfig().explorerUrl}/address/${address}`
}

export function evaluateRealModeReadiness(
  walletConnected: boolean,
  onMonadNetwork: boolean,
): RealModeReadiness {
  if (!walletConnected) {
    return {
      ready: false,
      reason: '请先连接浏览器钱包后再切换到 real 模式。',
    }
  }

  if (!onMonadNetwork) {
    return {
      ready: false,
      reason: '当前钱包不在 Monad 网络上，real 模式已保持为可选预览。',
    }
  }

  return {
    ready: true,
    reason: '当前已具备 real 模式前置条件；若链上支付未完成，会自动回退到 simulated。',
  }
}

function buildSimulatedTxHash(requestId: string): string {
  const base = Buffer.from(requestId).toString('hex').slice(0, 64)
  return `0x${base.padEnd(64, '0')}`
}

export async function executeMonadPayment(
  options: ExecuteMonadPaymentOptions,
): Promise<MonadExecutionBase> {
  const mode = resolvePaymentMode(options.mode)
  const executedAt = new Date().toISOString()

  if (mode === 'real') {
    return {
      txStatus: 'success',
      txHash: buildSimulatedTxHash(options.request.requestId),
      simulated: true,
      mode: 'simulated',
      message: 'real 模式当前仅作为可选入口展示；本次执行已自动回退到 simulated 主路径。',
      executedAt,
    }
  }

  return {
    txStatus: 'success',
    txHash: buildSimulatedTxHash(options.request.requestId),
    simulated: true,
    mode: 'simulated',
    message: '已使用 simulated 模式完成支付执行。',
    executedAt,
  }
}