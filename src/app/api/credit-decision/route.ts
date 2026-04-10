// 信用决策接口。
// 负责接收 Agent 档案、信用规则和支付请求，并返回标准化的信用决策结果。
import { NextResponse } from 'next/server'

import { assessCreditPayment } from '@/lib/credit-engine'
import type { CreditDecisionPayload } from '@/lib/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): CreditDecisionPayload | null {
  if (!isRecord(value)) {
    return null
  }

  const agentProfile = value.agentProfile
  const creditRule = value.creditRule
  const paymentRequest = value.paymentRequest

  if (!agentProfile || !creditRule || !paymentRequest) {
    return null
  }

  return {
    agentProfile: agentProfile as CreditDecisionPayload['agentProfile'],
    creditRule: creditRule as CreditDecisionPayload['creditRule'],
    paymentRequest: paymentRequest as CreditDecisionPayload['paymentRequest'],
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const payload = parsePayload(body)

    if (!payload) {
      return NextResponse.json({ error: '请求体缺少 agentProfile、creditRule 或 paymentRequest。' }, { status: 400 })
    }

    const decision = assessCreditPayment(payload.agentProfile, payload.creditRule, payload.paymentRequest)
    return NextResponse.json(decision)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '信用决策计算失败。',
      },
      { status: 500 },
    )
  }
}