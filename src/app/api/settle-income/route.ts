// 收入结算接口。
// 负责在任务收入到账时触发自动还款，并返回还款记录与新的 Agent 档案。
import { NextResponse } from 'next/server'

import { settleIncomeRepayment } from '@/lib/credit-engine'
import type { SettleIncomePayload } from '@/lib/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): SettleIncomePayload | null {
  if (!isRecord(value)) {
    return null
  }

  const agentProfile = value.agentProfile
  const incomeAmount = value.incomeAmount
  const timestamp = value.timestamp

  if (!agentProfile || typeof incomeAmount !== 'number') {
    return null
  }

  return {
    agentProfile: agentProfile as SettleIncomePayload['agentProfile'],
    incomeAmount,
    timestamp: typeof timestamp === 'string' ? timestamp : undefined,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const payload = parsePayload(body)

    if (!payload) {
      return NextResponse.json({ error: '请求体缺少 agentProfile 或 incomeAmount。' }, { status: 400 })
    }

    const settlement = settleIncomeRepayment(
      payload.agentProfile,
      payload.incomeAmount,
      payload.timestamp,
    )

    return NextResponse.json(settlement)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '收入结算失败。',
      },
      { status: 500 },
    )
  }
}