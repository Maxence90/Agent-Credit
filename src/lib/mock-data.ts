// 演示用 mock 数据文件。
// 负责提供默认信用规则、任务类型和多个 Agent 演示档案。
import { calculateCreditLimit } from '@/lib/credit-engine'
import type { AgentProfile, CreditPaymentRequest, CreditRule, DemoCase } from '@/lib/types'

function buildAgentProfile(profile: Omit<AgentProfile, 'activeCreditLimit'>): AgentProfile {
  return {
    ...profile,
    activeCreditLimit: calculateCreditLimit(profile.baseCreditLimit, profile.reputationScore),
  }
}

export const defaultTaskTypes = ['api-call', 'data-fetch', 'compute-task']
export const defaultRecipients = [
  'Monad Compute Provider',
  'Inference Mesh',
  'Data Oracle Hub',
]

export const defaultCreditRule: CreditRule = {
  minReputation: 50,
  allowedTaskTypes: [...defaultTaskTypes],
  maxSingleCreditSpend: 1.5,
  cooldownHours: 1,
  penaltyRate: 0.02,
}

export const highReputationAgent = buildAgentProfile({
  id: 'agent-aurora',
  name: 'Aurora Relay',
  ownerAddress: '0xA912...BEEF',
  reputationScore: 92,
  baseCreditLimit: 10,
  creditUsed: 0.2,
  walletBalance: 0.12,
  lifetimeTasks: 184,
  successRate: 98,
  repaymentStatus: 'healthy',
  status: 'active',
  lastCreditDecisionAt: '2026-04-09T06:00:00.000Z',
})

export const mediumReputationAgent = buildAgentProfile({
  id: 'agent-harbor',
  name: 'Harbor Indexer',
  ownerAddress: '0xB712...CAFE',
  reputationScore: 66,
  baseCreditLimit: 8,
  creditUsed: 1.1,
  walletBalance: 0.05,
  lifetimeTasks: 72,
  successRate: 88,
  repaymentStatus: 'warning',
  status: 'restricted',
  lastCreditDecisionAt: '2026-04-09T09:30:00.000Z',
})

export const frozenAgent = buildAgentProfile({
  id: 'agent-cinder',
  name: 'Cinder Compute',
  ownerAddress: '0xC441...D00D',
  reputationScore: 28,
  baseCreditLimit: 6,
  creditUsed: 2.8,
  walletBalance: 0.01,
  lifetimeTasks: 39,
  successRate: 61,
  repaymentStatus: 'overdue',
  status: 'frozen',
  lastCreditDecisionAt: '2026-04-07T08:30:00.000Z',
})

export const demoAgentProfiles: AgentProfile[] = [
  highReputationAgent,
  mediumReputationAgent,
  frozenAgent,
]

export function createDemoAgentProfiles(): AgentProfile[] {
  return demoAgentProfiles.map((profile) => ({ ...profile }))
}

export const samplePaymentRequest: CreditPaymentRequest = {
  requestId: 'req-aurora-001',
  agentId: highReputationAgent.id,
  taskType: 'api-call',
  purpose: 'Pay for premium model inference API.',
  recipient: 'Monad Compute Provider',
  amount: 0.5,
  token: 'MON',
  timestamp: '2026-04-09T10:45:00.000Z',
}

export const sampleIncomeAmount = 1

export const demoCases: DemoCase[] = [
  {
    id: 'success-credit-payment',
    title: '成功路径',
    description: '高信誉 Agent 在余额不足时完成 0.5 MON 信用支付，随后用 1 MON 收入自动还款。',
    agentId: highReputationAgent.id,
    request: samplePaymentRequest,
    incomeAmount: 1,
    currentTimestamp: '2026-04-09T12:00:00.000Z',
    expectedOutcome: '支付允许，creditUsed 增加，收入到账后负债归零并恢复 healthy。',
  },
  {
    id: 'blocked-over-limit',
    title: '失败路径：超额度',
    description: '请求金额同时超过单笔限额和可用信用额度，应被直接 blocked。',
    agentId: mediumReputationAgent.id,
    request: {
      requestId: 'req-harbor-002',
      agentId: mediumReputationAgent.id,
      taskType: 'data-fetch',
      purpose: 'Attempt to prepay a large analytics batch.',
      recipient: defaultRecipients[2],
      amount: 2.4,
      token: 'MON',
      timestamp: '2026-04-09T11:20:00.000Z',
    },
    incomeAmount: 0,
    currentTimestamp: '2026-04-09T11:20:00.000Z',
    expectedOutcome: '决策 blocked，原因里包含超额度和超单笔限制。',
  },
  {
    id: 'blocked-frozen-agent',
    title: '失败路径：冻结状态',
    description: '已被冻结的 Agent 继续申请信用支付，系统应直接拒绝。',
    agentId: frozenAgent.id,
    request: {
      requestId: 'req-cinder-003',
      agentId: frozenAgent.id,
      taskType: 'compute-task',
      purpose: 'Attempt to buy extra compute while overdue.',
      recipient: defaultRecipients[0],
      amount: 0.4,
      token: 'MON',
      timestamp: '2026-04-09T12:15:00.000Z',
    },
    incomeAmount: 0.8,
    currentTimestamp: '2026-04-09T12:15:00.000Z',
    expectedOutcome: '决策 blocked，Penalty 卡片展示当前已处于逾期冻结状态。',
  },
  {
    id: 'blocked-unsupported-task',
    title: '失败路径：用途不符',
    description: '任务类型不在白名单内时，系统阻止信用支付。',
    agentId: highReputationAgent.id,
    request: {
      requestId: 'req-aurora-004',
      agentId: highReputationAgent.id,
      taskType: 'unsupported-task',
      purpose: 'Use credit for an unsupported off-policy task.',
      recipient: defaultRecipients[1],
      amount: 0.4,
      token: 'MON',
      timestamp: '2026-04-09T13:00:00.000Z',
    },
    incomeAmount: 0,
    currentTimestamp: '2026-04-09T13:00:00.000Z',
    expectedOutcome: '决策 blocked，原因里包含任务类型不被允许。',
  },
]