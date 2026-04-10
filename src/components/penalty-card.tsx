'use client'

// 惩罚状态卡片组件。
// 负责展示逾期等级、预览惩罚结果，并在需要时触发降额或冻结。

import type { PenaltyState } from '@/lib/types'

const severityToneMap: Record<Exclude<PenaltyState['severity'], null>, string> = {
  light: 'border-amber-200 bg-amber-50 text-amber-900',
  medium: 'border-orange-200 bg-orange-50 text-orange-900',
  severe: 'border-rose-200 bg-rose-50 text-rose-900',
}

interface PenaltyCardProps {
  penaltyState: PenaltyState
  onApplyPenalty: () => void
  feedbackMessage?: string | null
}

export function PenaltyCard({ penaltyState, onApplyPenalty, feedbackMessage }: PenaltyCardProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Penalty State
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">逾期与冻结状态</h2>
        </div>
        {penaltyState.severity ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${severityToneMap[penaltyState.severity]}`}
          >
            {penaltyState.severity}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
            healthy
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <PenaltyMetric label="逾期状态" value={penaltyState.isOverdue ? 'overdue' : 'healthy'} />
        <PenaltyMetric label="逾期时长" value={`${penaltyState.overdueHours.toFixed(2)} h`} />
        <PenaltyMetric label="当前额度" value={`${penaltyState.currentCreditLimit.toFixed(2)} MON`} />
        <PenaltyMetric label="惩罚后额度" value={`${penaltyState.newCreditLimit.toFixed(2)} MON`} />
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-4 text-sm text-slate-600">
        <p>{penaltyState.summary}</p>
        {feedbackMessage ? <p className="mt-3 font-medium text-ink">{feedbackMessage}</p> : null}
      </div>

      <button
        className="mt-6 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
        disabled={!penaltyState.penaltyApplied}
        onClick={onApplyPenalty}
        type="button"
      >
        {penaltyState.penaltyApplied ? '应用逾期惩罚' : '当前无需新增惩罚'}
      </button>
    </section>
  )
}

interface PenaltyMetricProps {
  label: string
  value: string
}

function PenaltyMetric({ label, value }: PenaltyMetricProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  )
}