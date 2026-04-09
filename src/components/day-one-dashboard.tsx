'use client'

// Day 1 仪表盘组件。
// 负责把 Agent 档案、支付请求和信用决策组织成静态授信闭环页面。

import { useState } from 'react'

import { AgentProfileCard } from '@/components/agent-profile-card'
import { CreditDecisionCard } from '@/components/credit-decision-card'
import { CreditRequestForm } from '@/components/credit-request-form'
import { assessCreditPayment } from '@/lib/credit-engine'
import {
  defaultCreditRule,
  defaultTaskTypes,
  demoAgentProfiles,
  samplePaymentRequest,
} from '@/lib/mock-data'
import type { CreditPaymentRequest } from '@/lib/types'

export function DayOneDashboard() {
  const [selectedAgentId, setSelectedAgentId] = useState(demoAgentProfiles[0]?.id ?? '')
  const [request, setRequest] = useState<CreditPaymentRequest>(samplePaymentRequest)

  const selectedProfile =
    demoAgentProfiles.find((profile) => profile.id === selectedAgentId) ?? demoAgentProfiles[0]

  const normalizedRequest: CreditPaymentRequest = {
    ...request,
    agentId: selectedProfile.id,
  }

  const decision = assessCreditPayment(selectedProfile, defaultCreditRule, normalizedRequest)

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <AgentProfileCard profile={selectedProfile} />
        <CreditDecisionCard decision={decision} />
      </div>

      <div className="space-y-6">
        <CreditRequestForm
          onAgentChange={setSelectedAgentId}
          onRequestChange={setRequest}
          profiles={demoAgentProfiles}
          request={normalizedRequest}
          selectedAgentId={selectedAgentId}
          taskTypes={defaultTaskTypes}
        />

        <section className="rounded-[2rem] border border-[color:var(--border)] bg-slate-950 p-6 text-white shadow-panel md:p-7">
          <p className="font-[family:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.3em] text-slate-400">
            Day 1 Goal
          </p>
          <h2 className="mt-3 text-2xl font-semibold">完成静态授信与决策闭环</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>当前页面已经覆盖信誉分、额度、支付请求与风控决策三段链路。</p>
            <p>切换 Agent 或调整金额、任务类型后，决策卡会立即反馈 allowed、review 或 blocked。</p>
            <p>Day 2 可以在此基础上继续接支付执行、收入还款和惩罚逻辑。</p>
          </div>
        </section>
      </div>
    </div>
  )
}