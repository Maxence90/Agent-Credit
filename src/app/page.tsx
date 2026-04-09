// 首页页面文件。
// 负责组合项目说明区和 Day 1 仪表盘，作为当前版本的主展示页面。
import { DayOneDashboard } from '@/components/day-one-dashboard'

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="rounded-[2.5rem] border border-white/60 bg-white/55 p-6 shadow-panel backdrop-blur md:p-8 lg:p-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.24em] text-amber-800">
            Monad Credit Layer
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight text-ink md:text-6xl">
            将 AI Agent 的可靠性转换为可消费的信用支付能力。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            这是 Agent Credit 的 Day 1 页面骨架：先完成评分、授信、决策三步静态闭环，证明 Agent 在余额不足时仍可基于信誉拿到支付能力。
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Highlight label="核心公式" value="额度 = 基础额度 × 信誉分 / 100" />
          <Highlight label="Day 1 范围" value="Profile / Request / Decision" />
          <Highlight label="当前输出" value="allowed / review / blocked" />
        </div>
      </section>

      <section className="mt-8">
        <DayOneDashboard />
      </section>
    </main>
  )
}

interface HighlightProps {
  label: string
  value: string
}

function Highlight({ label, value }: HighlightProps) {
  return (
    <div className="rounded-[1.75rem] border border-black/5 bg-white/75 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  )
}