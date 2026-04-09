'use client'

// 信用支付请求表单组件。
// 负责输入 Agent、任务类型、金额、收款方和用途，生成静态支付请求。

import type { AgentProfile, CreditPaymentRequest } from '@/lib/types'

interface CreditRequestFormProps {
  profiles: AgentProfile[]
  selectedAgentId: string
  request: CreditPaymentRequest
  taskTypes: string[]
  onAgentChange: (agentId: string) => void
  onRequestChange: (request: CreditPaymentRequest) => void
}

export function CreditRequestForm({
  profiles,
  selectedAgentId,
  request,
  taskTypes,
  onAgentChange,
  onRequestChange,
}: CreditRequestFormProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-panel backdrop-blur md:p-7">
      <div>
        <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-500">
          Credit Request
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-ink">配置一笔信用支付请求</h2>
      </div>

      <div className="mt-6 grid gap-4">
        <Field label="选择 Agent">
          <select
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
            value={selectedAgentId}
            onChange={(event) => onAgentChange(event.target.value)}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="任务类型">
            <select
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
              value={request.taskType}
              onChange={(event) =>
                onRequestChange({
                  ...request,
                  taskType: event.target.value,
                })
              }
            >
              {taskTypes.map((taskType) => (
                <option key={taskType} value={taskType}>
                  {taskType}
                </option>
              ))}
              <option value="unsupported-task">unsupported-task</option>
            </select>
          </Field>

          <Field label="支付金额 (MON)">
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
              min="0"
              step="0.1"
              type="number"
              value={request.amount}
              onChange={(event) =>
                onRequestChange({
                  ...request,
                  amount: Number(event.target.value),
                })
              }
            />
          </Field>
        </div>

        <Field label="收款方">
          <input
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
            type="text"
            value={request.recipient}
            onChange={(event) =>
              onRequestChange({
                ...request,
                recipient: event.target.value,
              })
            }
          />
        </Field>

        <Field label="支付用途">
          <textarea
            className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
            value={request.purpose}
            onChange={(event) =>
              onRequestChange({
                ...request,
                purpose: event.target.value,
              })
            }
          />
        </Field>
      </div>
    </section>
  )
}

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}