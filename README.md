# Agent Credit

Agent Credit 是一个面向 AI Agent 的信用支付 MVP，目标是在 Monad 上展示这样一条最小闭环：Agent 不再只能消费已有余额，而是可以基于信誉获得可透支的支付额度，在任务收入到账后自动还款，并在逾期时触发惩罚。

## 一句话定义

让 AI Agent 在 Monad 上基于信誉获得可透支的支付信用线，从而在余额不足时仍能完成任务相关支付，并在任务收入到账后自动还款。

## Why This Matters

当前很多 AI Agent 已经能完成搜索、调用工具、生成内容和执行任务，但真正进入支付环节时，仍然依赖人工批准或预充值钱包。这会带来三个直接问题：

1. 普通钱包权限过大，直接交给 Agent 风险很高。
2. 预算钱包只能花已有余额，无法表达信誉驱动的支付能力。
3. 很多任务天然存在先支出、后回款的现金流结构，需要信用而不是余额。

Agent Credit 的核心主张不是“有钱才能支付”，而是“可信的 Agent 可以先支付，再用任务收入还款”。

## Core Loop

MVP 只证明最关键的五个动作：

1. Agent 拥有信誉分。
2. 信誉分决定信用额度。
3. 当钱包余额不足时，Agent 可以在额度内发起信用支付。
4. 任务收益到账后，系统自动优先还款。
5. 若逾期未还，则触发罚分、降额或冻结。

## Product Scope

本版本聚焦最小可信 Demo，不试图一次性解决完整去中心化征信问题。

本版本重点实现：

1. Agent 信誉档案展示。
2. 信用额度计算。
3. 信用支付决策。
4. 模拟支付执行。
5. 自动还款。
6. 逾期惩罚。
7. 成功路径和失败路径演示。

本版本明确不做：

1. 完整的可信任务预言机。
2. 强身份绑定和抗女巫系统。
3. 开放式信贷市场。
4. 完整金融合规体系。
5. 复杂代币经济与服务商结算网络。

## Demo Story

推荐对外演示的主路径如下：

1. 选择一个高信誉 Agent。
2. 展示其余额不足，但仍具备可用信用额度。
3. 发起一笔 0.5 MON 的服务支付请求。
4. 系统根据信誉、额度、任务类型和风控规则给出允许决策。
5. 完成一笔模拟支付或真实小额支付。
6. 在任务收入到账后自动归还欠款。
7. 展示欠款减少、余额更新与信用状态恢复。

同时至少保留三类失败路径：

1. 超额度支付被 blocked。
2. 冻结 Agent 无法继续发起信用支付。
3. 不在白名单内的任务类型被 blocked 或 review。

## Credit Model

本版本采用足够直观的线性模型：

```text
activeCreditLimit = baseCreditLimit * reputationScore / 100
availableCredit = activeCreditLimit - creditUsed
```

支付判断优先检查：

1. Agent 是否被冻结。
2. 任务类型是否允许。
3. 支付金额是否小于等于 availableCredit。
4. 是否命中额外风险规则。

自动还款逻辑遵循：

1. 收入优先覆盖 creditUsed。
2. 若本金还清，可再结算极低手续费。
3. 剩余部分进入 Agent 钱包余额。
4. 若按时归还，可小幅恢复信誉。

## Roles In The System

1. Agent：执行任务、发起支付、接收收入并承担信用状态变化。
2. Platform / Owner：为 Agent 建立初始信誉档案，并触发任务结算或收益入账。
3. Service Provider：接收 Agent 支付，提供 API、算力、数据、存储或执行服务。
4. Credit Engine：负责额度计算、风险判断、违约检测和状态更新。

## Architecture

项目建议使用 Next.js + TypeScript 的前后端一体结构，核心分为四层：

1. Frontend：展示 Agent、额度、支付请求、决策、还款与惩罚状态。
2. Agent Credit Service：读取 Agent Profile，维护收入、欠款与上下文。
3. Risk & Rules Engine：输出 allowed、review、blocked 决策。
4. Payment & Repayment Execution：执行模拟支付或真实支付，并在收入到账后自动还款。

推荐技术栈：

1. Next.js App Router
2. TypeScript
3. Tailwind CSS
4. wagmi + viem
5. Next.js Route Handlers

推荐核心模块：

```text
src/
  app/
    page.tsx
    api/
      credit-decision/
      execute-credit-payment/
      settle-income/
  components/
    agent-profile-card.tsx
    credit-request-form.tsx
    credit-decision-card.tsx
    payment-execution-card.tsx
    repayment-card.tsx
    penalty-card.tsx
  lib/
    types.ts
    mock-data.ts
    credit-engine.ts
    penalties.ts
    monad.ts
```

## What Goes On-Chain

建议上链的内容：

1. Agent 信誉状态摘要。
2. 信用额度与已用额度。
3. 关键支付记录。
4. 欠款与还款状态。
5. 惩罚状态。

建议链下维护的内容：

1. 更复杂的信誉评分来源。
2. 服务商评价与风险特征。
3. Demo 用 mock 收益和历史记录。
4. 更细粒度的规则解释与辅助数据。

## MVP Deliverables

必须完成：

1. 一个可运行的 Demo 页面。
2. Agent Profile 展示。
3. 信用额度计算结果展示。
4. 信用支付决策展示。
5. 自动还款流程展示。
6. 至少 1 条成功路径。
7. 至少 2 条失败路径。

可选加分项：

1. 一笔真实 Monad 小额支付。
2. 简单链上状态展示。
3. 信誉变化时间线或动画。

## Roadmap

MVP 之后可以继续扩展：

1. 引入更真实的信誉评分来源。
2. 接入 DID 与更稳定的 Agent 身份系统。
3. 支持 Agent 之间互保和信用拆借。
4. 建立更完整的代币流通与赎回机制。
5. 形成服务商信誉和风险协同体系。

## Current Repository Status

当前仓库以项目说明为主，README 对外描述了产品目标、核心闭环和实现方向。后续代码落地可优先从以下模块开始：

1. lib/types.ts
2. lib/mock-data.ts
3. lib/credit-engine.ts
4. lib/penalties.ts
5. 单页 Demo UI

## License

暂未指定。