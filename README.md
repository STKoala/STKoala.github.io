# STKoala.github.io

个人博客，基于 **Hexo + Matery**。

## 本地启动

```bash
npm install
npm run server
```

打开 `http://localhost:4000` 预览。

## 发布方式

已配置 GitHub Actions：

- push 到 `main` 后自动构建
- 自动部署到 GitHub Pages

## 目录说明

- `source/_posts/`：文章
- `source/about/index.md`：关于页
- `source/friends/index.md`：友情链接
- `_config.yml`：Hexo 站点配置
- `.github/workflows/pages.yml`：自动部署配置

## 新建文章

```bash
npx hexo new "你的文章标题"
```

## 多语言文章

默认文章语言是中文。要给一篇文章增加英文或日文版本，在 `source/_posts/` 里新增同一 slug 的语言后缀文件：

```text
source/_posts/why-i-start-blogging.md
source/_posts/why-i-start-blogging.en.md
source/_posts/why-i-start-blogging.ja.md
```

翻译版 front matter 里加 `lang`：

```yaml
---
title: Why I Started Blogging
date: 2026-05-11 15:00:00
lang: en
categories:
  - life
tags:
  - blog
---
```

日文版使用 `lang: ja`。构建时会自动生成 `/en/...`、`/ja/...` 路径，并在同一组文章顶部显示中文 / 日本語 / English 切换链接。

如果翻译文件不想使用 `.en.md` 或 `.ja.md` 后缀，可以给同组文章手动设置相同的 `translation_key`。

## 自动翻译

仓库里有自动翻译脚本和 GitHub Actions 工作流：

- `npm run translate:en`：把最近 31 天的中文原文翻译成英文
- `npm run translate:ja`：把最近 31 天的中文原文翻译成日文
- `.github/workflows/translate-articles.yml`：每周六自动翻译，也可以在 GitHub Actions 页面手动触发

默认使用 OpenAI。使用 OpenAI 时，本地运行前需要设置：

```bash
export OPENAI_API_KEY="你的 OpenAI API Key"
npm run translate:en
npm run translate:ja
```

常用参数：

```bash
# 只演练，不调用 OpenAI
npm run translate:en -- --dry-run --all

# 翻译全部中文原文
npm run translate:ja -- --all

# 指定单篇文章
node scripts/translate-articles.js en source/_posts/why-i-start-blogging.md

# 覆盖已有译文
npm run translate:en -- --force --all
```

如果想用 DeepSeek 翻译，本地这样设置：

```bash
export TRANSLATION_PROVIDER="deepseek"
export DEEPSEEK_API_KEY="你的 DeepSeek API Key"
export DEEPSEEK_TRANSLATION_MODEL="deepseek-v4-pro"
npm run translate:en
npm run translate:ja
```

GitHub Actions 配置：

- 使用 OpenAI：在仓库 Secrets 配置 `OPENAI_API_KEY`。可选地，在 Variables 里配置 `OPENAI_TRANSLATION_MODEL` 覆盖默认模型 `o4-mini`。
- 使用 DeepSeek：在仓库 Secrets 配置 `DEEPSEEK_API_KEY`，在 Variables 配置 `TRANSLATION_PROVIDER=deepseek`。可选地，配置 `DEEPSEEK_TRANSLATION_MODEL=deepseek-v4-pro` 和 `DEEPSEEK_BASE_URL=https://api.deepseek.com`。
