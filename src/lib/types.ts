// 核心类型定义文件。
// 负责声明 Agent、信用规则、支付请求、决策结果和还款结果等基础数据结构。
export type AgentStatus = 'active' | 'restricted' | 'frozen'
export type RepaymentStatus = 'healthy' | 'warning' | 'overdue'
export type CreditDecisionStatus = 'allowed' | 'review' | 'blocked'
export type PaymentMode = 'simulated' | 'real'

export interface AgentProfile {
  id: string
  name: string
  ownerAddress: string
  // 信誉分，范围建议为 0 到 100，用于决定当前可生效的信用额度。
  reputationScore: number
  // 基础信用额度上限，由平台或 owner 设定，代表该 Agent 的长期授信天花板。
  baseCreditLimit: number
  // 当前有效信用额度，通常根据信誉分和风险状态从基础额度折算得到，一般不超过 baseCreditLimit。
  activeCreditLimit: number
  // 当前已占用的信用额度，剩余可用额度通常等于 activeCreditLimit - creditUsed。
  creditUsed: number
  walletBalance: number
  lifetimeTasks: number
  successRate: number
  repaymentStatus: RepaymentStatus
  status: AgentStatus
  lastCreditDecisionAt?: string
}

export interface CreditRule {
  minReputation: number
  allowedTaskTypes: string[]
  maxSingleCreditSpend: number
  cooldownHours: number
  penaltyRate: number
}

export interface CreditPaymentRequest {
  requestId: string
  agentId: string
  taskType: string
  purpose: string
  recipient: string
  amount: number
  token: string
  timestamp: string
}

export interface CreditDecision {
  decision: CreditDecisionStatus
  availableCredit: number
  newCreditUsed: number
  reasons: string[]
  warnings: string[]
  requiredAction?: string
}

export interface RepaymentRecord {
  repaymentId: string
  agentId: string
  incomeAmount: number
  principalPaid: number
  feePaid: number
  remainingDebt: number
  timestamp: string
}

export interface RepaymentSettlement {
  principalPaid: number
  feePaid: number
  remainingDebt: number
  newWalletBalance: number
  newProfile: AgentProfile
}

export function isAgentActive(profile: AgentProfile): boolean {
  return profile.status === 'active'
}

export function isAgentFrozen(profile: AgentProfile): boolean {
  return profile.status === 'frozen'
}

export function isAgentRestricted(profile: AgentProfile): boolean {
  return profile.status === 'restricted'
}