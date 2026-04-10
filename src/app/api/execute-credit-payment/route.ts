// 支付执行接口。
// 负责在 allowed 决策下执行 simulated 支付，并在成功时更新 Agent 的 creditUsed。
import { NextResponse } from 'next/server'

import { applyCreditUsage } from '@/lib/credit-engine'
import { executeMonadPayment, resolvePaymentMode } from '@/lib/monad'
import type { ExecuteCreditPaymentPayload, PaymentExecutionResult } from '@/lib/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): ExecuteCreditPaymentPayload | null {
  if (!isRecord(value)) {
    return null
  }

  const agentProfile = value.agentProfile
  const paymentRequest = value.paymentRequest
  const decision = value.decision
  const mode = value.mode

  if (!agentProfile || !paymentRequest || !decision) {
    return null
  }

  return {
    agentProfile: agentProfile as ExecuteCreditPaymentPayload['agentProfile'],
    paymentRequest: paymentRequest as ExecuteCreditPaymentPayload['paymentRequest'],
    decision: decision as ExecuteCreditPaymentPayload['decision'],
    mode: mode as ExecuteCreditPaymentPayload['mode'],
  }
}

function buildRejectedResult(payload: ExecuteCreditPaymentPayload, message: string): PaymentExecutionResult {
  const mode = resolvePaymentMode(payload.mode)

  return {
    txStatus: 'rejected',
    simulated: mode !== 'real',
    amount: payload.paymentRequest.amount,
    newCreditUsed: payload.agentProfile.creditUsed,
    mode,
    message,
    executedAt: new Date().toISOString(),
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const payload = parsePayload(body)

    if (!payload) {
      return NextResponse.json(
        { error: '请求体缺少 agentProfile、paymentRequest 或 decision。' },
        { status: 400 },
      )
    }

    if (payload.decision.decision !== 'allowed') {
      return NextResponse.json(buildRejectedResult(payload, '当前决策不是 allowed，系统拒绝执行信用支付。'))
    }

    const executionBase = await executeMonadPayment({
      request: payload.paymentRequest,
      mode: payload.mode,
    })

    if (executionBase.txStatus !== 'success') {
      return NextResponse.json({
        ...executionBase,
        amount: payload.paymentRequest.amount,
        newCreditUsed: payload.agentProfile.creditUsed,
      })
    }

    const updatedProfile = applyCreditUsage(payload.agentProfile, payload.paymentRequest.amount)

    return NextResponse.json({
      ...executionBase,
      amount: payload.paymentRequest.amount,
      newCreditUsed: updatedProfile.creditUsed,
      updatedProfile,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '支付执行失败。',
      },
      { status: 500 },
    )
  }
}