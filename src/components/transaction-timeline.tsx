'use client'

// 交易时间线组件。
// 负责展示支付执行、收入还款、惩罚和场景切换等关键事件，增强 Day 3 的演示叙事。

import { getExplorerTransactionUrl } from '@/lib/monad'
import type { CreditTimelineEvent } from '@/lib/types'

const levelToneMap: Record<CreditTimelineEvent['level'], string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
}

interface TransactionTimelineProps {
  events: CreditTimelineEvent[]
}

export function TransactionTimeline({ events }: TransactionTimelineProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-panel backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
            Timeline
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">交易记录与状态时间线</h2>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {events.length} events
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {events.length > 0 ? (
          events.map((event) => {
            const explorerUrl = getExplorerTransactionUrl(event.txHash)

            return (
              <article key={event.id} className="rounded-[1.5rem] border border-black/5 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${levelToneMap[event.level]}`}>
                    {event.level}
                  </span>
                  <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                    {new Date(event.timestamp).toLocaleString('zh-CN', { hour12: false })}
                  </p>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-ink">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  {typeof event.amount === 'number' ? <span>金额 {event.amount.toFixed(2)} MON</span> : null}
                  {event.mode ? <span>模式 {event.mode}</span> : null}
                  {event.txHash ? <span className="break-all">哈希 {event.txHash}</span> : null}
                </div>

                {explorerUrl ? <p className="mt-2 break-all text-xs text-slate-400">Explorer {explorerUrl}</p> : null}
              </article>
            )
          })
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/60 p-5 text-sm text-slate-500">
            当前还没有时间线事件。连接钱包、执行支付、收入结算或应用惩罚后，这里会持续累积演示记录。
          </div>
        )}
      </div>
    </section>
  )
}