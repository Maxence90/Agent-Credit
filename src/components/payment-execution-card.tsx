'use client'

// 支付执行卡片组件。
// 负责展示 simulated 或 real 模式下的支付执行状态，并触发信用支付执行。

import type { PaymentExecutionResult, PaymentMode } from '@/lib/types'

const executionToneMap: Record<NonNullable<PaymentExecutionResult['txStatus']>, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  failed: 'border-rose-200 bg-rose-50 text-rose-900',
  rejected: 'border-amber-200 bg-amber-50 text-amber-900',
}

interface PaymentExecutionCardProps {
  executionResult: PaymentExecutionResult | null
  decisionStatus: 'allowed' | 'review' | 'blocked'
  mode: PaymentMode
  onExecute: () => void
  isPending: boolean
}

export function PaymentExecutionCard({
  executionResult,
  decisionStatus,
  mode,
  onExecute,
  isPending,
}: PaymentExecutionCardProps) {
  const buttonLabel =
    decisionStatus === 'allowed'
      ? '执行信用支付'
      : decisionStatus === 'review'
        ? '当前需人工复核'
        : '当前决策已阻止执行'

  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Payment Execution
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">执行信用支付</h2>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.24em] text-white">
          {mode}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatusMetric label="执行状态" value={executionResult?.txStatus ?? 'idle'} />
        <StatusMetric label="最新已用额度" value={executionResult ? `${executionResult.newCreditUsed.toFixed(2)} MON` : '--'} />
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-4 text-sm text-slate-600">
        {executionResult ? (
          <>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${executionToneMap[executionResult.txStatus]}`}
            >
              {executionResult.txStatus}
            </span>
            <p className="mt-3">{executionResult.message}</p>
            <p className="mt-2">支付金额 {executionResult.amount.toFixed(2)} MON</p>
            <p className="mt-2 break-all">交易哈希 {executionResult.txHash ?? '当前没有生成交易哈希。'}</p>
          </>
        ) : (
          <p>
            当前还没有执行支付。点击下方按钮后，这里会显示执行结果、交易哈希和新的 creditUsed。
            {decisionStatus !== 'allowed' ? ' 如果当前决策不是 allowed，系统会立即返回拒绝原因。' : ''}
          </p>
        )}
      </div>

      <button
        className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isPending}
        onClick={onExecute}
        type="button"
      >
        {isPending ? '执行中...' : buttonLabel}
      </button>
    </section>
  )
}

interface StatusMetricProps {
  label: string
  value: string
}

function StatusMetric({ label, value }: StatusMetricProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  )
}