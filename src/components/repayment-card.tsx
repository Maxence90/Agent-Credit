'use client'

// 自动还款卡片组件。
// 负责输入收入金额、触发自动还款，并展示本金偿还、余额变化和还款记录。

import type { RepaymentSettlement } from '@/lib/types'

interface RepaymentCardProps {
  incomeAmount: number
  settlement: RepaymentSettlement | null
  onIncomeAmountChange: (value: number) => void
  onSettle: () => void
  isPending: boolean
}

export function RepaymentCard({
  incomeAmount,
  settlement,
  onIncomeAmountChange,
  onSettle,
  isPending,
}: RepaymentCardProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div>
        <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
          Repayment
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-ink">收入到账后自动还款</h2>
      </div>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium text-slate-600">模拟收入金额 (MON)</span>
        <input
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
          min="0"
          onChange={(event) => onIncomeAmountChange(Number(event.target.value))}
          step="0.1"
          type="number"
          value={incomeAmount}
        />
      </label>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <RepaymentMetric label="本金偿还" value={settlement ? `${settlement.principalPaid.toFixed(2)} MON` : '--'} />
        <RepaymentMetric label="剩余负债" value={settlement ? `${settlement.remainingDebt.toFixed(2)} MON` : '--'} />
        <RepaymentMetric label="新钱包余额" value={settlement ? `${settlement.newWalletBalance.toFixed(2)} MON` : '--'} />
        <RepaymentMetric label="信誉变化" value={settlement ? `${settlement.reputationDelta >= 0 ? '+' : ''}${settlement.reputationDelta}` : '--'} />
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-4 text-sm text-slate-600">
        {settlement ? (
          <>
            <p>结算状态 {settlement.settlementStatus}</p>
            <p className="mt-2 break-all">还款记录 ID {settlement.repaymentRecord.repaymentId}</p>
            <p className="mt-2">记录时间 {settlement.repaymentRecord.timestamp}</p>
          </>
        ) : (
          <p>当任务收入到账后，系统会优先归还 creditUsed，对应的结果会显示在这里。</p>
        )}
      </div>

      <button
        className="mt-6 inline-flex items-center justify-center rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
        disabled={isPending}
        onClick={onSettle}
        type="button"
      >
        {isPending ? '结算中...' : '模拟收入结算'}
      </button>
    </section>
  )
}

interface RepaymentMetricProps {
  label: string
  value: string
}

function RepaymentMetric({ label, value }: RepaymentMetricProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  )
}