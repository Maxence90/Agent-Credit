// 逾期惩罚逻辑文件。
// 负责识别逾期等级，并根据惩罚级别更新 Agent 的信誉、额度和状态。
import { calculateCreditLimit } from '@/lib/credit-engine'
import { roundMon } from '@/lib/credit-engine'
import type { AgentProfile, PenaltySeverity, PenaltyState } from '@/lib/types'

function calculateOverdueHours(profile: AgentProfile, currentTimestamp: string): number {
  if (!profile.lastCreditDecisionAt || profile.creditUsed <= 0) {
    return 0
  }

  const lastDecisionTime = new Date(profile.lastCreditDecisionAt).getTime()
  const currentTime = new Date(currentTimestamp).getTime()

  if (Number.isNaN(lastDecisionTime) || Number.isNaN(currentTime)) {
    return 0
  }

  return Math.max(0, (currentTime - lastDecisionTime) / (1000 * 60 * 60))
}

export function evaluateOverdueState(
  profile: AgentProfile,
  currentTimestamp: string,
): PenaltySeverity | null {
  const overdueHours = calculateOverdueHours(profile, currentTimestamp)

  if (overdueHours === 0) {
    return null
  }

  if (overdueHours >= 72) {
    return 'severe'
  }

  if (overdueHours >= 48) {
    return 'medium'
  }

  if (overdueHours >= 24) {
    return 'light'
  }

  return null
}

export function applyPenaltyToProfile(
  profile: AgentProfile,
  severity: PenaltySeverity,
): AgentProfile {
  if (severity === 'light') {
    const reputationScore = Math.max(0, profile.reputationScore - 10)
    const reducedLimit = roundMon(calculateCreditLimit(profile.baseCreditLimit, reputationScore) / 2)

    return {
      ...profile,
      reputationScore,
      activeCreditLimit: reducedLimit,
      repaymentStatus: 'overdue',
      status: 'restricted',
    }
  }

  if (severity === 'medium') {
    const reputationScore = Math.max(0, profile.reputationScore - 25)
    return {
      ...profile,
      reputationScore,
      activeCreditLimit: 0,
      repaymentStatus: 'overdue',
      status: 'frozen',
    }
  }

  return {
    ...profile,
    reputationScore: 0,
    activeCreditLimit: 0,
    repaymentStatus: 'overdue',
    status: 'frozen',
  }
}

export function freezeAgentIfNeeded(profile: AgentProfile): AgentProfile {
  if (profile.repaymentStatus === 'overdue' && profile.creditUsed > 0) {
    return {
      ...profile,
      activeCreditLimit: 0,
      status: 'frozen',
    }
  }

  return profile
}

function buildPenaltySummary(severity: PenaltySeverity | null, profile: AgentProfile): string {
  if (!severity) {
    return '当前没有命中逾期惩罚条件。'
  }

  if (profile.repaymentStatus === 'overdue' || profile.status === 'frozen') {
    return 'Agent 已处于逾期惩罚状态，新的信用支付会被继续拒绝。'
  }

  if (severity === 'light') {
    return '轻度逾期：信誉分下降，额度减半，并进入 restricted 状态。'
  }

  if (severity === 'medium') {
    return '中度逾期：支付权限冻结，后续收入只能优先用于还款。'
  }

  return '严重逾期：信誉清零，额度归零，Agent 进入冻结状态。'
}

export function buildPenaltyState(profile: AgentProfile, currentTimestamp: string): PenaltyState {
  const severity = evaluateOverdueState(profile, currentTimestamp)
  const overdueHours = roundMon(calculateOverdueHours(profile, currentTimestamp))

  if (!severity) {
    return {
      severity: null,
      isOverdue: false,
      penaltyApplied: false,
      overdueHours,
      currentCreditLimit: profile.activeCreditLimit,
      newCreditLimit: profile.activeCreditLimit,
      summary: buildPenaltySummary(null, profile),
      newProfile: profile,
    }
  }

  if (profile.repaymentStatus === 'overdue' || profile.status === 'frozen') {
    return {
      severity,
      isOverdue: true,
      penaltyApplied: false,
      overdueHours,
      currentCreditLimit: profile.activeCreditLimit,
      newCreditLimit: profile.activeCreditLimit,
      summary: buildPenaltySummary(severity, profile),
      newProfile: profile,
    }
  }

  const penalizedProfile = freezeAgentIfNeeded(applyPenaltyToProfile(profile, severity))

  return {
    severity,
    isOverdue: true,
    penaltyApplied: true,
    overdueHours,
    currentCreditLimit: profile.activeCreditLimit,
    newCreditLimit: penalizedProfile.activeCreditLimit,
    summary: buildPenaltySummary(severity, profile),
    newProfile: penalizedProfile,
  }
}