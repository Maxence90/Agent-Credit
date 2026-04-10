'use client'

// 钱包状态卡片组件。
// 负责展示钱包连接状态、当前网络、Monad 切换入口以及 simulated 或 real 模式选择。

import type { PaymentMode } from '@/lib/types'
import type { WalletConnectionState } from '@/hooks/use-wallet'

const walletToneMap: Record<WalletConnectionState, string> = {
  connected: 'bg-emerald-100 text-emerald-800',
  connecting: 'bg-amber-100 text-amber-800',
  disconnected: 'bg-slate-200 text-slate-700',
  unsupported: 'bg-rose-100 text-rose-800',
}

interface WalletStatusCardProps {
  addressUrl?: string
  canUseRealMode: boolean
  connectError?: string
  isConnected: boolean
  isOnMonad: boolean
  isSwitching: boolean
  networkLabel: string
  onConnect: () => void | Promise<void>
  onDisconnect: () => void
  onPaymentModeChange: (mode: PaymentMode) => void
  onSwitchToMonad: () => void | Promise<void>
  paymentMode: PaymentMode
  realModeHint: string
  shortAddress: string
  switchError?: string
  walletStatus: WalletConnectionState
}

export function WalletStatusCard({
  addressUrl,
  canUseRealMode,
  connectError,
  isConnected,
  isOnMonad,
  isSwitching,
  networkLabel,
  onConnect,
  onDisconnect,
  onPaymentModeChange,
  onSwitchToMonad,
  paymentMode,
  realModeHint,
  shortAddress,
  switchError,
  walletStatus,
}: WalletStatusCardProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Wallet & Network
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Monad 钱包接入状态</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${walletToneMap[walletStatus]}`}>
          {walletStatus}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="钱包地址" value={shortAddress} />
        <Metric label="当前网络" value={networkLabel} />
        <Metric label="支付模式" value={paymentMode} />
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-4 text-sm text-slate-600">
        <p>网络状态：{isOnMonad ? '当前已在 Monad 网络，可继续演示。' : '当前不在 Monad 网络，real 模式仍会回退到 simulated。'}</p>
        <p className="mt-2">{realModeHint}</p>
        {addressUrl ? (
          <p className="mt-2 break-all text-slate-500">Explorer 地址：{addressUrl}</p>
        ) : null}
        {connectError ? <p className="mt-2 text-rose-700">连接错误：{connectError}</p> : null}
        {switchError ? <p className="mt-2 text-rose-700">切网错误：{switchError}</p> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isConnected ? (
          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={onDisconnect}
            type="button"
          >
            断开钱包
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center rounded-full bg-tide px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            onClick={() => void onConnect()}
            type="button"
          >
            连接钱包
          </button>
        )}

        {isConnected && !isOnMonad ? (
          <button
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
            disabled={isSwitching}
            onClick={() => void onSwitchToMonad()}
            type="button"
          >
            {isSwitching ? '切换中...' : '切换到 Monad'}
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          className={`rounded-3xl border px-4 py-4 text-left transition ${
            paymentMode === 'simulated'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-black/10 bg-white/80 text-slate-600'
          }`}
          onClick={() => onPaymentModeChange('simulated')}
          type="button"
        >
          <p className="text-sm font-semibold">Simulated</p>
          <p className="mt-2 text-sm">默认主路径，适合弱网或现场演示，所有外部失败都可回退。</p>
        </button>

        <button
          className={`rounded-3xl border px-4 py-4 text-left transition ${
            paymentMode === 'real'
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-black/10 bg-white/80 text-slate-600'
          } ${canUseRealMode ? '' : 'cursor-not-allowed opacity-70'}`}
          disabled={!canUseRealMode}
          onClick={() => onPaymentModeChange('real')}
          type="button"
        >
          <p className="text-sm font-semibold">Real Preview</p>
          <p className="mt-2 text-sm">钱包连上 Monad 后可切换到 real 入口；若签名或链上执行未准备好，会自动降级回 simulated。</p>
        </button>
      </div>
    </section>
  )
}

interface MetricProps {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  )
}