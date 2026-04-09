// 演示用 mock 数据文件。
// 负责提供默认信用规则、任务类型和多个 Agent 演示档案。
import { calculateCreditLimit } from '@/lib/credit-engine'
import type { AgentProfile, CreditPaymentRequest, CreditRule } from '@/lib/types'

function buildAgentProfile(profile: Omit<AgentProfile, 'activeCreditLimit'>): AgentProfile {
  return {
    ...profile,
    activeCreditLimit: calculateCreditLimit(profile.baseCreditLimit, profile.reputationScore),
  }
}

export const defaultTaskTypes = ['api-call', 'data-fetch', 'compute-task']

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