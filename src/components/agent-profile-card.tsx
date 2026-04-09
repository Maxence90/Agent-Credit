// Agent 档案卡片组件。
// 负责展示 Agent 的信誉分、信用额度、已用额度、钱包余额和当前状态。
import { calculateAvailableCredit } from '@/lib/credit-engine'
import type { AgentProfile } from '@/lib/types'

const statusToneMap: Record<AgentProfile['status'], string> = {
  active: 'text-emerald-700 bg-emerald-100',
  restricted: 'text-amber-700 bg-amber-100',
  frozen: 'text-rose-700 bg-rose-100',
}

interface AgentProfileCardProps {
  profile: AgentProfile
}

export function AgentProfileCard({ profile }: AgentProfileCardProps) {
  const availableCredit = calculateAvailableCredit(profile)

  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Agent Profile
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">{profile.name}</h2>
          <p className="mt-2 text-sm text-slate-600">Owner {profile.ownerAddress}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${statusToneMap[profile.status]}`}>
          {profile.status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="信誉分" value={`${profile.reputationScore}`} accent="text-ember" />
        <Metric label="当前信用额度" value={`${profile.activeCreditLimit.toFixed(2)} MON`} accent="text-tide" />
        <Metric label="可用信用额度" value={`${availableCredit.toFixed(2)} MON`} accent="text-sky-700" />
        <Metric label="已使用额度" value={`${profile.creditUsed.toFixed(2)} MON`} />
        <Metric label="钱包余额" value={`${profile.walletBalance.toFixed(2)} MON`} />
        <Metric label="成功率" value={`${profile.successRate}%`} />
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white/70 p-4 text-sm text-slate-600">
        <p>累计任务数 {profile.lifetimeTasks}</p>
        <p className="mt-2">还款状态 {profile.repaymentStatus}</p>
      </div>
    </section>
  )
}

interface MetricProps {
  label: string
  value: string
  accent?: string
}

function Metric({ label, value, accent = 'text-ink' }: MetricProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${accent}`}>{value}</p>
    </div>
  )
}