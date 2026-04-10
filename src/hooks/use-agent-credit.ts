'use client'

// Agent Credit 状态 Hook。
// 负责维护交易时间线，并提供统一的事件写入和重置能力。

import { useState } from 'react'

import type { CreditTimelineEvent, PaymentMode, TimelineEventLevel } from '@/lib/types'

interface RecordTimelineEventInput {
  title: string
  detail: string
  level: TimelineEventLevel
  timestamp?: string
  txHash?: string
  amount?: number
  mode?: PaymentMode
}

function buildTimelineEvent(input: RecordTimelineEventInput): CreditTimelineEvent {
  const timestamp = input.timestamp ?? new Date().toISOString()
  const safeTitle = input.title.toLowerCase().replace(/\s+/g, '-')

  return {
    id: `${safeTitle}-${timestamp}`,
    title: input.title,
    detail: input.detail,
    level: input.level,
    timestamp,
    txHash: input.txHash,
    amount: input.amount,
    mode: input.mode,
  }
}

export function useAgentCredit() {
  const [timelineEvents, setTimelineEvents] = useState<CreditTimelineEvent[]>([])

  function recordTimelineEvent(input: RecordTimelineEventInput): CreditTimelineEvent {
    const nextEvent = buildTimelineEvent(input)

    setTimelineEvents((currentEvents) => [nextEvent, ...currentEvents].slice(0, 12))
    return nextEvent
  }

  function resetTimeline(events: CreditTimelineEvent[] = []): void {
    setTimelineEvents(events)
  }

  return {
    recordTimelineEvent,
    resetTimeline,
    timelineEvents,
  }
}