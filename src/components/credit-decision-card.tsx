// 信用决策结果卡片组件。
// 负责展示风控决策结果、原因说明、风险提示和建议动作。
import type { CreditDecision } from '@/lib/types'

const decisionToneMap: Record<CreditDecision['decision'], string> = {
  allowed: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  review: 'border-amber-200 bg-amber-50 text-amber-900',
  blocked: 'border-rose-200 bg-rose-50 text-rose-900',
}

interface CreditDecisionCardProps {
  decision: CreditDecision
}

export function CreditDecisionCard({ decision }: CreditDecisionCardProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Credit Decision
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">当前风控决策</h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${decisionToneMap[decision.decision]}`}
        >
          {decision.decision}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DecisionMetric label="可用额度" value={`${decision.availableCredit.toFixed(2)} MON`} />
        <DecisionMetric label="支付后已用额度" value={`${decision.newCreditUsed.toFixed(2)} MON`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <InfoList title="原因" items={decision.reasons} emptyText="当前没有额外原因说明。" />
        <InfoList title="风险提示" items={decision.warnings} emptyText="当前没有额外风险提示。" />
      </div>

      {decision.requiredAction ? (
        <div className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-4 text-sm text-slate-700">
          <p className="font-medium text-ink">建议动作</p>
          <p className="mt-2">{decision.requiredAction}</p>
        </div>
      ) : null}
    </section>
  )
}

interface DecisionMetricProps {
  label: string
  value: string
}

function DecisionMetric({ label, value }: DecisionMetricProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  )
}

interface InfoListProps {
  title: string
  items: string[]
  emptyText: string
}

function InfoList({ title, items, emptyText }: InfoListProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {items.length > 0 ? items.map((item) => <p key={item}>• {item}</p>) : <p>{emptyText}</p>}
      </div>
    </div>
  )
}