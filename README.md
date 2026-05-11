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
