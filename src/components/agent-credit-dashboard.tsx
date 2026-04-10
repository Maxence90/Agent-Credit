'use client'

// Day 3 仪表盘组件。
// 负责把钱包连接、网络检测、支付模式、交易时间线和信用主链路整合到同一页演示中。

import { useEffect, useState } from 'react'

import { AgentProfileCard } from '@/components/agent-profile-card'
import { CreditDecisionCard } from '@/components/credit-decision-card'
import { CreditRequestForm } from '@/components/credit-request-form'
import { DemoCases } from '@/components/demo-cases'
import { PaymentExecutionCard } from '@/components/payment-execution-card'
import { PenaltyCard } from '@/components/penalty-card'
import { RepaymentCard } from '@/components/repayment-card'
import { TransactionTimeline } from '@/components/transaction-timeline'
import { WalletStatusCard } from '@/components/wallet-status-card'
import { useAgentCredit } from '@/hooks/use-agent-credit'
import { useWallet } from '@/hooks/use-wallet'
import { applyCreditUsage, assessCreditPayment, settleIncomeRepayment } from '@/lib/credit-engine'
import {
  createDemoAgentProfiles,
  defaultCreditRule,
  defaultTaskTypes,
  demoCases,
  sampleIncomeAmount,
  samplePaymentRequest,
} from '@/lib/mock-data'
import { executeMonadPayment, resolvePaymentMode } from '@/lib/monad'
import { buildPenaltyState } from '@/lib/penalties'
import type {
  AgentProfile,
  CreditDecision,
  CreditDecisionPayload,
  CreditPaymentRequest,
  ExecuteCreditPaymentPayload,
  PaymentMode,
  PaymentExecutionResult,
  RepaymentSettlement,
  SettleIncomePayload,
} from '@/lib/types'

const fallbackProfiles = createDemoAgentProfiles()
const initialCase = demoCases[0]

function replaceProfileList(profiles: AgentProfile[], updatedProfile: AgentProfile): AgentProfile[] {
  return profiles.map((profile) => (profile.id === updatedProfile.id ? updatedProfile : profile))
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const errorBody = (await response.json()) as { error?: string }
    return errorBody.error ?? '请求失败。'
  } catch {
    return '请求失败。'
  }
}

function buildLocalRejectedExecutionResult(
  amount: number,
  decision: CreditDecision,
  creditUsed: number,
  mode: PaymentMode,
): PaymentExecutionResult {
  const reasonText = decision.reasons.join('；') || '当前决策未允许执行。'
  const actionText = decision.requiredAction ? ` 建议动作：${decision.requiredAction}` : ''

  return {
    txStatus: 'rejected',
    simulated: true,
    amount,
    newCreditUsed: creditUsed,
    mode,
    message: `${reasonText}${actionText}`,
    executedAt: new Date().toISOString(),
  }
}

export function AgentCreditDashboard() {
  const wallet = useWallet()
  const { recordTimelineEvent, resetTimeline, timelineEvents } = useAgentCredit()
  const [profiles, setProfiles] = useState<AgentProfile[]>(fallbackProfiles)
  const [selectedCaseId, setSelectedCaseId] = useState(initialCase.id)
  const [selectedAgentId, setSelectedAgentId] = useState(initialCase.agentId)
  const [request, setRequest] = useState<CreditPaymentRequest>(samplePaymentRequest)
  const [incomeAmount, setIncomeAmount] = useState(sampleIncomeAmount)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(resolvePaymentMode())
  const [decision, setDecision] = useState<CreditDecision>(() =>
    assessCreditPayment(fallbackProfiles[0], defaultCreditRule, samplePaymentRequest),
  )
  const [decisionPending, setDecisionPending] = useState(false)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)
  const [executionResult, setExecutionResult] = useState<PaymentExecutionResult | null>(null)
  const [executionPending, setExecutionPending] = useState(false)
  const [settlement, setSettlement] = useState<RepaymentSettlement | null>(null)
  const [settlementPending, setSettlementPending] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [penaltyMessage, setPenaltyMessage] = useState<string | null>(null)

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedAgentId) ?? profiles[0] ?? fallbackProfiles[0]

  const normalizedRequest: CreditPaymentRequest = {
    ...request,
    agentId: selectedProfile.id,
  }

  const penaltyState = buildPenaltyState(selectedProfile, normalizedRequest.timestamp)

  useEffect(() => {
    setExecutionResult(null)
    setSettlement(null)
    setActionMessage(null)
    setPenaltyMessage(null)
  }, [selectedAgentId, request.amount, request.purpose, request.recipient, request.taskType, request.timestamp])

  useEffect(() => {
    resetTimeline([
      {
        id: 'day3-ready',
        title: 'Day 3 演示已就绪',
        detail: '当前页面已接入钱包连接入口、Monad 网络检测、支付模式切换与交易时间线。',
        level: 'info',
        timestamp: new Date().toISOString(),
        mode: paymentMode,
      },
    ])
  }, [resetTimeline])

  useEffect(() => {
    if (paymentMode === 'real' && !wallet.realModeReadiness.ready) {
      setPaymentMode('simulated')
    }
  }, [paymentMode, wallet.realModeReadiness.ready])

  useEffect(() => {
    let cancelled = false

    async function loadDecision() {
      setDecisionPending(true)
      setDecisionMessage(null)

      try {
        const payload: CreditDecisionPayload = {
          agentProfile: selectedProfile,
          creditRule: defaultCreditRule,
          paymentRequest: normalizedRequest,
        }

        const response = await fetch('/api/credit-decision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(await readErrorMessage(response))
        }

        const nextDecision = (await response.json()) as CreditDecision

        if (!cancelled) {
          setDecision(nextDecision)
        }
      } catch {
        if (!cancelled) {
          setDecision(assessCreditPayment(selectedProfile, defaultCreditRule, normalizedRequest))
          setDecisionMessage('决策接口暂不可用，当前已回退为本地信用引擎计算。')
        }
      } finally {
        if (!cancelled) {
          setDecisionPending(false)
        }
      }
    }

    void loadDecision()

    return () => {
      cancelled = true
    }
  }, [
    normalizedRequest.agentId,
    normalizedRequest.amount,
    normalizedRequest.purpose,
    normalizedRequest.recipient,
    normalizedRequest.taskType,
    normalizedRequest.timestamp,
    selectedProfile.activeCreditLimit,
    selectedProfile.creditUsed,
    selectedProfile.lastCreditDecisionAt,
    selectedProfile.repaymentStatus,
    selectedProfile.reputationScore,
    selectedProfile.status,
  ])

  function handleSelectCase(caseId: string) {
    const nextCase = demoCases.find((demoCase) => demoCase.id === caseId)

    if (!nextCase) {
      return
    }

    setProfiles(createDemoAgentProfiles())
    setSelectedCaseId(caseId)
    setSelectedAgentId(nextCase.agentId)
    setRequest({ ...nextCase.request })
    setIncomeAmount(nextCase.incomeAmount)
    setDecisionMessage(null)
    setActionMessage(null)
    setPenaltyMessage(null)
    resetTimeline([
      {
        id: `${caseId}-loaded`,
        title: `已载入 ${nextCase.title}`,
        detail: `${nextCase.description} 预期结果：${nextCase.expectedOutcome}`,
        level: 'info',
        timestamp: new Date().toISOString(),
      },
    ])
  }

  function handlePaymentModeChange(mode: PaymentMode) {
    setPaymentMode(mode)
    setActionMessage(mode === 'real' ? wallet.realModeReadiness.reason : '已切换到 simulated 模式，适合现场稳定演示。')
    recordTimelineEvent({
      title: `支付模式切换为 ${mode}`,
      detail: mode === 'real' ? wallet.realModeReadiness.reason : '后续支付会优先走 simulated 主路径。',
      level: 'info',
      mode,
    })
  }

  async function handleConnectWallet() {
    try {
      await wallet.connectWallet()
      setActionMessage('钱包已连接，可以继续检测网络或切换到 Monad。')
      recordTimelineEvent({
        title: '钱包已连接',
        detail: '浏览器钱包已连接，Day 3 的网络检测与 real 模式入口现在可用。',
        level: 'info',
      })
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : '钱包连接失败。')
    }
  }

  function handleDisconnectWallet() {
    wallet.disconnectWallet()
    setPaymentMode('simulated')
    setActionMessage('钱包已断开，系统已回到 simulated 演示模式。')
    recordTimelineEvent({
      title: '钱包已断开',
      detail: '为确保主演示稳定，支付模式已自动恢复到 simulated。',
      level: 'warning',
      mode: 'simulated',
    })
  }

  async function handleSwitchToMonad() {
    try {
      await wallet.switchToMonad()
      setActionMessage('已请求钱包切换到 Monad 网络。')
      recordTimelineEvent({
        title: '切换 Monad 网络',
        detail: '已向钱包发起切网请求；若钱包支持，real 模式入口会随之解锁。',
        level: 'info',
      })
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : '切换 Monad 网络失败。')
    }
  }

  async function handleExecutePayment() {
    setExecutionPending(true)
    setActionMessage(null)

    try {
      if (decision.decision !== 'allowed') {
        const localRejectedResult = buildLocalRejectedExecutionResult(
          normalizedRequest.amount,
          decision,
          selectedProfile.creditUsed,
          paymentMode,
        )

        setExecutionResult(localRejectedResult)
        setActionMessage(localRejectedResult.message)
        recordTimelineEvent({
          title: '支付执行被拒绝',
          detail: localRejectedResult.message,
          level: 'error',
          amount: normalizedRequest.amount,
          mode: paymentMode,
        })
        return
      }

      const payload: ExecuteCreditPaymentPayload = {
        agentProfile: selectedProfile,
        paymentRequest: normalizedRequest,
        decision,
        mode: paymentMode,
      }

      const response = await fetch('/api/execute-credit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const result = (await response.json()) as PaymentExecutionResult
      setExecutionResult(result)
      setActionMessage(result.message)
      recordTimelineEvent({
        title: result.simulated ? '支付执行成功（simulated）' : '支付执行成功（real）',
        detail: result.message,
        level: result.txStatus === 'success' ? 'success' : result.txStatus === 'rejected' ? 'warning' : 'error',
        txHash: result.txHash,
        amount: result.amount,
        mode: result.mode,
      })

      const updatedProfile = result.updatedProfile

      if (updatedProfile) {
        setProfiles((currentProfiles) => replaceProfileList(currentProfiles, updatedProfile))
      }
    } catch (error) {
      try {
        const fallbackExecution = await executeMonadPayment({
          request: normalizedRequest,
          mode: paymentMode,
        })
        const fallbackProfile = applyCreditUsage(selectedProfile, normalizedRequest.amount)
        const fallbackResult: PaymentExecutionResult = {
          ...fallbackExecution,
          amount: normalizedRequest.amount,
          newCreditUsed: fallbackProfile.creditUsed,
          updatedProfile: fallbackProfile,
          message: `${fallbackExecution.message} 接口不可用，已回退为本地执行。`,
        }

        setExecutionResult(fallbackResult)
        setProfiles((currentProfiles) => replaceProfileList(currentProfiles, fallbackProfile))
        setActionMessage(fallbackResult.message)
        recordTimelineEvent({
          title: '支付执行已本地回退',
          detail: fallbackResult.message,
          level: 'warning',
          txHash: fallbackResult.txHash,
          amount: fallbackResult.amount,
          mode: fallbackResult.mode,
        })
      } catch (fallbackError) {
        setActionMessage(
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : '支付执行失败。',
        )
      }
    } finally {
      setExecutionPending(false)
    }
  }

  async function handleSettleIncome() {
    setSettlementPending(true)
    setActionMessage(null)

    try {
      const payload: SettleIncomePayload = {
        agentProfile: selectedProfile,
        incomeAmount,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch('/api/settle-income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const result = (await response.json()) as RepaymentSettlement
      setSettlement(result)
      setProfiles((currentProfiles) => replaceProfileList(currentProfiles, result.newProfile))
      recordTimelineEvent({
        title: '收入结算成功',
        detail: `已自动归还 ${result.principalPaid.toFixed(2)} MON，本次结算后剩余负债 ${result.remainingDebt.toFixed(2)} MON。`,
        level: 'success',
        amount: result.principalPaid,
        mode: paymentMode,
      })
    } catch (error) {
      try {
        const fallbackSettlement = settleIncomeRepayment(selectedProfile, incomeAmount, new Date().toISOString())
        setSettlement(fallbackSettlement)
        setProfiles((currentProfiles) => replaceProfileList(currentProfiles, fallbackSettlement.newProfile))
        setActionMessage('收入结算接口暂不可用，已回退到本地自动还款逻辑。')
        recordTimelineEvent({
          title: '收入结算已本地回退',
          detail: `已本地归还 ${fallbackSettlement.principalPaid.toFixed(2)} MON，剩余负债 ${fallbackSettlement.remainingDebt.toFixed(2)} MON。`,
          level: 'warning',
          amount: fallbackSettlement.principalPaid,
          mode: paymentMode,
        })
      } catch (fallbackError) {
        setActionMessage(
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : '自动还款失败。',
        )
      }
    } finally {
      setSettlementPending(false)
    }
  }

  function handleApplyPenalty() {
    if (!penaltyState.penaltyApplied) {
      setPenaltyMessage(penaltyState.summary)
      recordTimelineEvent({
        title: '未命中新惩罚',
        detail: penaltyState.summary,
        level: 'info',
      })
      return
    }

    setProfiles((currentProfiles) => replaceProfileList(currentProfiles, penaltyState.newProfile))
    setPenaltyMessage('已根据当前逾期等级应用惩罚，额度和状态已更新。')
    recordTimelineEvent({
      title: '已应用逾期惩罚',
      detail: `惩罚等级 ${penaltyState.severity ?? 'none'}，新额度 ${penaltyState.newCreditLimit.toFixed(2)} MON。`,
      level: 'warning',
    })
  }

  return (
    <div className="space-y-6">
      <DemoCases activeCaseId={selectedCaseId} cases={demoCases} onSelectCase={handleSelectCase} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <WalletStatusCard
          addressUrl={wallet.addressUrl}
          canUseRealMode={wallet.realModeReadiness.ready}
          connectError={wallet.connectError}
          isConnected={wallet.isConnected}
          isOnMonad={wallet.isOnMonad}
          isSwitching={wallet.isSwitching}
          networkLabel={wallet.networkLabel}
          onConnect={handleConnectWallet}
          onDisconnect={handleDisconnectWallet}
          onPaymentModeChange={handlePaymentModeChange}
          onSwitchToMonad={handleSwitchToMonad}
          paymentMode={paymentMode}
          realModeHint={wallet.realModeReadiness.reason}
          shortAddress={wallet.shortAddress}
          switchError={wallet.switchError}
          walletStatus={wallet.walletStatus}
        />
        <TransactionTimeline events={timelineEvents} />
      </div>

      {(decisionMessage || actionMessage || decisionPending) && (
        <section className="rounded-[1.75rem] border border-black/5 bg-white/75 p-4 text-sm text-slate-600">
          {decisionPending ? <p>正在根据当前 Agent 状态请求最新信用决策...</p> : null}
          {decisionMessage ? <p className={decisionPending ? 'mt-2' : ''}>{decisionMessage}</p> : null}
          {actionMessage ? (
            <p className={decisionPending || decisionMessage ? 'mt-2 font-medium text-ink' : 'font-medium text-ink'}>
              {actionMessage}
            </p>
          ) : null}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <AgentProfileCard profile={selectedProfile} />
          <CreditDecisionCard decision={decision} />
          <PaymentExecutionCard
            decisionStatus={decision.decision}
            executionResult={executionResult}
            isPending={executionPending}
            mode={paymentMode}
            onExecute={handleExecutePayment}
          />
        </div>

        <div className="space-y-6">
          <CreditRequestForm
            onAgentChange={setSelectedAgentId}
            onRequestChange={setRequest}
            profiles={profiles}
            request={normalizedRequest}
            selectedAgentId={selectedAgentId}
            taskTypes={defaultTaskTypes}
          />
          <RepaymentCard
            incomeAmount={incomeAmount}
            isPending={settlementPending}
            onIncomeAmountChange={setIncomeAmount}
            onSettle={handleSettleIncome}
            settlement={settlement}
          />
          <PenaltyCard feedbackMessage={penaltyMessage} onApplyPenalty={handleApplyPenalty} penaltyState={penaltyState} />
        </div>
      </div>
    </div>
  )
}