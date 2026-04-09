// 逾期惩罚逻辑文件。
// 负责识别逾期等级，并根据惩罚级别更新 Agent 的信誉、额度和状态。
import { calculateCreditLimit } from '@/lib/credit-engine'
import type { AgentProfile } from '@/lib/types'

export type PenaltySeverity = 'light' | 'medium' | 'severe'

export function evaluateOverdueState(
  profile: AgentProfile,
  currentTimestamp: string,
): PenaltySeverity | null {
  if (!profile.lastCreditDecisionAt || profile.creditUsed <= 0) {
    return null
  }

  const lastDecisionTime = new Date(profile.lastCreditDecisionAt).getTime()
  const currentTime = new Date(currentTimestamp).getTime()

  if (Number.isNaN(lastDecisionTime) || Number.isNaN(currentTime)) {
    return null
  }

  const overdueHours = (currentTime - lastDecisionTime) / (1000 * 60 * 60)

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
    return {
      ...profile,
      reputationScore,
      activeCreditLimit: calculateCreditLimit(profile.baseCreditLimit, reputationScore) / 2,
      repaymentStatus: 'overdue',
      status: 'restricted',
    }
  }

  if (severity === 'medium') {
    const reputationScore = Math.max(0, profile.reputationScore - 25)
    return {
      ...profile,
      reputationScore,
      activeCreditLimit: calculateCreditLimit(profile.baseCreditLimit, reputationScore),
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
      status: 'frozen',
    }
  }

  return profile
}