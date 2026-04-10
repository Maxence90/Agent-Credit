'use client'

// Demo 用例卡片组件。
// 负责切换主成功路径和失败路径，快速复现 Day 2 所需的演示场景。

import type { DemoCase } from '@/lib/types'

interface DemoCasesProps {
  cases: DemoCase[]
  activeCaseId: string
  onSelectCase: (caseId: string) => void
}

export function DemoCases({ cases, activeCaseId, onSelectCase }: DemoCasesProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Demo Cases
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">固化成功与失败路径</h2>
        </div>
        <p className="max-w-sm text-right text-sm text-slate-500">点击任意用例，会重置当前 Agent 状态、请求参数和收入金额，方便连续演示。</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {cases.map((demoCase) => {
          const isActive = demoCase.id === activeCaseId

          return (
            <button
              key={demoCase.id}
              className={`rounded-[1.75rem] border p-5 text-left transition ${
                isActive
                  ? 'border-ink bg-slate-950 text-white shadow-panel'
                  : 'border-black/5 bg-white/80 text-ink hover:border-slate-300'
              }`}
              onClick={() => onSelectCase(demoCase.id)}
              type="button"
            >
              <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.24em] opacity-70">
                {demoCase.title}
              </p>
              <p className="mt-3 text-lg font-semibold">{demoCase.description}</p>
              <p className={`mt-3 text-sm ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                预期结果：{demoCase.expectedOutcome}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}