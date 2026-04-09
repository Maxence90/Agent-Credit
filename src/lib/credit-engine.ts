// 信用引擎核心逻辑文件。
// 负责实现额度计算、支付评估、信用使用更新和收入自动还款。
import {
  type AgentProfile,
  type CreditDecision,
  type CreditPaymentRequest,
  type CreditRule,
  type RepaymentSettlement,
  isAgentFrozen,
  isAgentRestricted,
} from '@/lib/types'

function clampReputationScore(reputationScore: number): number {
  return Math.min(100, Math.max(0, reputationScore))
}

function roundMon(value: number): number {
  return Math.round(value * 10000) / 10000
}

function getCooldownState(profile: AgentProfile, cooldownHours: number, timestamp: string): boolean {
  if (!profile.lastCreditDecisionAt) {
    return false
  }

  const lastDecisionTime = new Date(profile.lastCreditDecisionAt).getTime()
  const requestTime = new Date(timestamp).getTime()

  if (Number.isNaN(lastDecisionTime) || Number.isNaN(requestTime)) {
    return false
  }

  const elapsedMs = requestTime - lastDecisionTime
  return elapsedMs < cooldownHours * 60 * 60 * 1000
}

/**
 * 根据信誉分计算 Agent 当前有效信用额度。
 */
export function calculateCreditLimit(baseCreditLimit: number, reputationScore: number): number {
  const normalizedScore = clampReputationScore(reputationScore)
  return roundMon((baseCreditLimit * normalizedScore) / 100)
}

/**
 * 计算 Agent 当前剩余可用信用额度。
 */
export function calculateAvailableCredit(profile: AgentProfile): number {
  const activeCreditLimit = calculateCreditLimit(profile.baseCreditLimit, profile.reputationScore)
  return Math.max(0, roundMon(activeCreditLimit - profile.creditUsed))
}

/**
 * 对一笔信用支付请求进行静态风控判断。
 */
export function assessCreditPayment(
  profile: AgentProfile,
  rule: CreditRule,
  request: CreditPaymentRequest,
): CreditDecision {
  const availableCredit = calculateAvailableCredit(profile)
  const reasons: string[] = []
  const warnings: string[] = []

  if (isAgentFrozen(profile)) {
    reasons.push('Agent 已被冻结，不能继续发起信用支付。')
    return {
      decision: 'blocked',
      availableCredit,
      newCreditUsed: profile.creditUsed,
      reasons,
      warnings,
      requiredAction: '等待人工解冻或完成坏账处理。',
    }
  }

  if (profile.reputationScore < rule.minReputation) {
    reasons.push('信誉分低于当前规则要求。')
  }

  if (!rule.allowedTaskTypes.includes(request.taskType)) {
    reasons.push('当前任务类型不在信用支付白名单中。')
  }

  if (request.amount > rule.maxSingleCreditSpend) {
    reasons.push('单笔支付金额超过规则上限。')
  }

  if (request.amount > availableCredit) {
    reasons.push('支付金额超过当前可用信用额度。')
  }

  if (getCooldownState(profile, rule.cooldownHours, request.timestamp)) {
    warnings.push('距离上一笔信用决策时间过短，建议人工复核。')
  }

  if (profile.walletBalance >= request.amount) {
    warnings.push('Agent 钱包余额已足够，本次不一定需要动用信用额度。')
  }

  if (reasons.length > 0) {
    return {
      decision: 'blocked',
      availableCredit,
      newCreditUsed: profile.creditUsed,
      reasons,
      warnings,
      requiredAction: '调整请求金额、用途或切换信誉更高的 Agent。',
    }
  }

  if (isAgentRestricted(profile) || warnings.length > 0) {
    return {
      decision: 'review',
      availableCredit,
      newCreditUsed: roundMon(profile.creditUsed + request.amount),
      reasons: ['请求满足基本额度要求，但存在需要复核的风险提示。'],
      warnings,
      requiredAction: '由平台或 owner 进行人工复核。',
    }
  }

  return {
    decision: 'allowed',
    availableCredit,
    newCreditUsed: roundMon(profile.creditUsed + request.amount),
    reasons: ['信誉、额度和任务类型均符合当前规则。'],
    warnings,
  }
}

/**
 * 在支付获批后更新 Agent 已使用信用额度。
 */
export function applyCreditUsage(profile: AgentProfile, amount: number): AgentProfile {
  if (amount <= 0) {
    throw new Error('信用支付金额必须大于 0。')
  }

  const availableCredit = calculateAvailableCredit(profile)
  if (amount > availableCredit) {
    throw new Error('信用支付金额超过可用信用额度。')
  }

  return {
    ...profile,
    activeCreditLimit: calculateCreditLimit(profile.baseCreditLimit, profile.reputationScore),
    creditUsed: roundMon(profile.creditUsed + amount),
    lastCreditDecisionAt: new Date().toISOString(),
  }
}

/**
 * 模拟任务收入到账后对欠款进行自动还款。
 */
export function settleIncomeRepayment(profile: AgentProfile, incomeAmount: number): RepaymentSettlement {
  if (incomeAmount < 0) {
    throw new Error('收入金额不能为负数。')
  }

  const principalPaid = Math.min(profile.creditUsed, incomeAmount)
  const remainingIncome = roundMon(incomeAmount - principalPaid)
  const remainingDebt = roundMon(profile.creditUsed - principalPaid)
  const reputationBonus = principalPaid > 0 && remainingDebt === 0 ? 2 : principalPaid > 0 ? 1 : 0
  const newReputationScore = Math.min(100, profile.reputationScore + reputationBonus)

  const newProfile: AgentProfile = {
    ...profile,
    reputationScore: newReputationScore,
    activeCreditLimit: calculateCreditLimit(profile.baseCreditLimit, newReputationScore),
    creditUsed: remainingDebt,
    walletBalance: roundMon(profile.walletBalance + remainingIncome),
    repaymentStatus: remainingDebt === 0 ? 'healthy' : 'warning',
  }

  return {
    principalPaid: roundMon(principalPaid),
    feePaid: 0,
    remainingDebt,
    newWalletBalance: newProfile.walletBalance,
    newProfile,
  }
}