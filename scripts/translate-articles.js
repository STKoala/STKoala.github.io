'use strict';

const fs = require('fs');
const path = require('path');
const frontMatter = require('hexo-front-matter');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const DEFAULT_DAYS = 31;
const TRANSLATION_PROVIDER = (process.env.TRANSLATION_PROVIDER || 'openai').toLowerCase();
const OPENAI_MODEL = process.env.OPENAI_TRANSLATION_MODEL || 'o4-mini';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_TRANSLATION_MODEL || 'deepseek-v4-pro';
const OPENAI_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_TRANSLATION_MAX_OUTPUT_TOKENS || 20000);
const DEEPSEEK_MAX_TOKENS = Number(process.env.DEEPSEEK_TRANSLATION_MAX_TOKENS || 20000);
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
const LANGUAGE_SUFFIX_RE = /\.(en|ja|jp|zh|zh-cn)$/i;

const TARGET_LANGUAGES = {
  en: {
    code: 'en',
    label: 'English',
    filenameSuffix: 'en'
  },
  ja: {
    code: 'ja',
    label: 'Japanese',
    filenameSuffix: 'ja'
  }
};

function usage() {
  console.log(`Usage:
  node scripts/translate-articles.js <en|ja> [source/_posts/article.md] [--all] [--days=31] [--force] [--dry-run]

Environment:
  TRANSLATION_PROVIDER                   openai | deepseek, default: openai
  OPENAI_API_KEY                         Required for OpenAI unless --dry-run
  OPENAI_TRANSLATION_MODEL               Default: o4-mini
  OPENAI_TRANSLATION_MAX_OUTPUT_TOKENS   Default: 20000
  DEEPSEEK_API_KEY                       Required for DeepSeek unless --dry-run
  DEEPSEEK_BASE_URL                      Default: https://api.deepseek.com
  DEEPSEEK_TRANSLATION_MODEL             Default: deepseek-v4-pro
  DEEPSEEK_TRANSLATION_MAX_TOKENS        Default: 20000
`);
}

function parseArgs(argv) {
  const args = {
    lang: argv[2],
    file: null,
    all: false,
    force: false,
    dryRun: false,
    days: DEFAULT_DAYS
  };

  for (const arg of argv.slice(3)) {
    if (arg === '--all') args.all = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--days=')) args.days = Number(arg.slice('--days='.length));
    else if (!args.file) args.file = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!TARGET_LANGUAGES[args.lang]) {
    usage();
    throw new Error('Target language must be en or ja.');
  }
  if (!Number.isFinite(args.days) || args.days < 0) {
    throw new Error('--days must be a non-negative number.');
  }
  return args;
}

function readFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...readFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.md')) {
      result.push(fullPath);
    }
  }
  return result;
}

function stripMdExt(filePath) {
  return filePath.replace(/\.md$/i, '');
}

function stripLanguageSuffix(value) {
  return String(value || '').replace(LANGUAGE_SUFFIX_RE, '');
}

function slugFromPath(filePath) {
  return path.basename(stripMdExt(filePath));
}

function targetPathFor(sourcePath, langConfig) {
  const dir = path.dirname(sourcePath);
  const slug = stripLanguageSuffix(slugFromPath(sourcePath));
  return path.join(dir, `${slug}.${langConfig.filenameSuffix}.md`);
}

function normalizeLang(lang) {
  if (!lang) return 'zh-CN';
  const value = String(lang).toLowerCase();
  if (value === 'en' || value === 'en-us' || value === 'en-gb') return 'en';
  if (value === 'ja' || value === 'jp' || value === 'ja-jp') return 'ja';
  return 'zh-CN';
}

function isOriginalChinesePost(filePath, data) {
  if (LANGUAGE_SUFFIX_RE.test(slugFromPath(filePath))) return false;
  if (data.skip_translate || data.translate === false) return false;
  return normalizeLang(data.lang || data.language) === 'zh-CN';
}

function parsePost(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return {
    filePath,
    text,
    data: frontMatter.parse(text)
  };
}

function publishedAt(data) {
  if (!data.date) return null;
  const date = data.date instanceof Date ? data.date : new Date(data.date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isRecent(data, days) {
  if (days === 0) return true;
  const date = publishedAt(data);
  if (!date) return false;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= since;
}

function findTargets(args, langConfig) {
  if (args.file) {
    const filePath = path.resolve(ROOT, args.file);
    return [parsePost(filePath)];
  }

  return readFiles(POSTS_DIR)
    .map(parsePost)
    .filter(post => isOriginalChinesePost(post.filePath, post.data))
    .filter(post => args.all || isRecent(post.data, args.days))
    .filter(post => args.force || !fs.existsSync(targetPathFor(post.filePath, langConfig)))
    .sort((a, b) => {
      const ad = publishedAt(a.data)?.getTime() || 0;
      const bd = publishedAt(b.data)?.getTime() || 0;
      return bd - ad;
    });
}

function makePrompt(markdown, targetLanguage) {
  return `Translate the following Chinese Markdown blog article into ${targetLanguage}.

Follow these rules exactly:

- Preserve the Markdown structure.
- Preserve YAML front matter delimiters (\`---\`) and return a complete Markdown file.
- In YAML front matter, translate only the \`title\` field.
- Keep all other YAML fields unchanged.
- Do not add code fences around the full document.
- Translate all Chinese prose in the article body into ${targetLanguage}.
- Preserve code blocks, inline code, commands, package names, file paths, URLs, image links, and HTML tags.
- Do not summarize, shorten, omit sections, or add commentary.
- Return only the translated Markdown document.

Article:

${markdown}`;
}

async function callOpenAI(input) {
  const requestBody = {
    model: OPENAI_MODEL,
    input,
    max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS
  };
  if (/^(o\d|o[1-9]|gpt-5)/i.test(OPENAI_MODEL)) {
    requestBody.reasoning = {
      effort: process.env.OPENAI_TRANSLATION_REASONING_EFFORT || 'high'
    };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.error?.message || response.statusText;
    throw new Error(`OpenAI API failed (${response.status}): ${detail}`);
  }
  return body;
}

async function callDeepSeek(messages) {
  const requestBody = {
    model: DEEPSEEK_MODEL,
    messages,
    stream: false,
    max_tokens: DEEPSEEK_MAX_TOKENS
  };
  if (/^(deepseek-v4-pro|deepseek-reasoner)$/i.test(DEEPSEEK_MODEL)) {
    requestBody.thinking = { type: 'enabled' };
    requestBody.reasoning_effort = process.env.DEEPSEEK_REASONING_EFFORT || 'high';
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.error?.message || response.statusText;
    throw new Error(`DeepSeek API failed (${response.status}): ${detail}`);
  }
  return body;
}

function outputText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  if (response.choices?.[0]?.message?.content) return response.choices[0].message.content;
  return (response.output || [])
    .flatMap(item => item.content || [])
    .filter(part => part.type === 'output_text' || part.type === 'text')
    .map(part => part.text)
    .join('');
}

async function translateMarkdown(markdown, langConfig) {
  if (TRANSLATION_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for TRANSLATION_PROVIDER=openai.');
  }
  if (TRANSLATION_PROVIDER === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is required for TRANSLATION_PROVIDER=deepseek.');
  }
  if (!['openai', 'deepseek'].includes(TRANSLATION_PROVIDER)) {
    throw new Error(`Unsupported TRANSLATION_PROVIDER: ${TRANSLATION_PROVIDER}`);
  }

  const messages = [{
    role: 'user',
    content: makePrompt(markdown, langConfig.label)
  }];
  const chunks = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = TRANSLATION_PROVIDER === 'deepseek'
      ? await callDeepSeek(messages)
      : await callOpenAI(messages);
    const text = outputText(response);
    chunks.push(text);

    const finishReason = response.choices?.[0]?.finish_reason;
    const shouldContinue = response.incomplete_details?.reason === 'max_output_tokens' || finishReason === 'length';
    if (!shouldContinue) {
      break;
    }

    messages.push({
      role: 'assistant',
      content: text
    }, {
      role: 'user',
      content: 'Continue the translation exactly from where it stopped. Return only the remaining translated Markdown content.'
    });
  }

  return chunks.join('');
}

function stripWrapperFences(markdown) {
  return markdown.trim()
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trimStart();
}

function buildTranslatedPost(original, translatedMarkdown, langConfig) {
  const translated = frontMatter.parse(stripWrapperFences(translatedMarkdown));
  const originalData = { ...original.data };
  delete originalData._content;

  const title = translated.title || originalData.title;
  const slug = stripLanguageSuffix(slugFromPath(original.filePath));
  const finalData = {
    ...originalData,
    title,
    lang: langConfig.code,
    translation_key: originalData.translation_key || slug,
    _content: translated._content || stripWrapperFences(translatedMarkdown)
  };

  return frontMatter.stringify(finalData, {
    prefixSeparator: true,
    lineWidth: -1
  });
}

async function translateOne(post, langConfig, args) {
  const targetPath = targetPathFor(post.filePath, langConfig);
  const relativeSource = path.relative(ROOT, post.filePath);
  const relativeTarget = path.relative(ROOT, targetPath);

  if (!args.force && fs.existsSync(targetPath)) {
    return { source: relativeSource, target: relativeTarget, status: 'skipped', reason: 'target exists' };
  }

  if (args.dryRun) {
    return { source: relativeSource, target: relativeTarget, status: 'dry-run' };
  }

  const translatedMarkdown = await translateMarkdown(post.text, langConfig);
  const output = buildTranslatedPost(post, translatedMarkdown, langConfig);
  fs.writeFileSync(targetPath, output.endsWith('\n') ? output : `${output}\n`);
  return { source: relativeSource, target: relativeTarget, status: 'translated' };
}

async function main() {
  const args = parseArgs(process.argv);
  const langConfig = TARGET_LANGUAGES[args.lang];
  const targets = findTargets(args, langConfig);
  const succeeded = [];
  const failed = [];

  console.log(`Target language: ${langConfig.label}`);
  console.log(`Target articles: ${targets.length}`);

  for (const post of targets) {
    try {
      console.log(`Translating ${path.relative(ROOT, post.filePath)}...`);
      succeeded.push(await translateOne(post, langConfig, args));
    } catch (error) {
      const item = {
        source: path.relative(ROOT, post.filePath),
        status: 'failed',
        message: error.message
      };
      console.error(item);
      failed.push(item);
    }
  }

  const summary = { language: langConfig.code, succeeded, failed };
  fs.writeFileSync(path.join(ROOT, 'translated.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (failed.length) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  findTargets,
  targetPathFor,
  translateMarkdown,
  buildTranslatedPost
};
