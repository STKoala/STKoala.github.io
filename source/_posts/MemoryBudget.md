---
title: 1. 训练显存预算与激活优化
date: 2026-05-11 15:25:00
permalink: AI_Infra/1.DataParallel/MemoryBudget/
categories:
  - [AI_Infra, 1.DataParallel]
tags:
  - AI
  - AI Infra
  - 显存优化
toc: true
---

这是一篇用于演示多级分类路径的文章。

目标 URL：

- `/AI_Infra/1.DataParallel/MemoryBudget/`

## 一、训练显存的构成

训练时显存主要由四部分构成：

1. 参数（Parameters）
2. 梯度（Gradients）
3. 优化器状态（Optimizer States）
4. 激活值（Activations）

其中激活值通常会随着 batch size、序列长度、模型深度快速增长，是最常见的显存瓶颈。

## 二、常见优化手段

- Micro-batch + 梯度累积
- Activation Checkpointing
- FlashAttention
- ZeRO / FSDP

## 三、写作约定

后续你可以把同系列文章统一放到：

- `AI_Infra/1.DataParallel/...`
- `AI_Infra/2.Distributed/...`

这样网站结构会非常清晰。
