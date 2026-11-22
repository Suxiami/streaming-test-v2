# 流媒体与 AI 解锁检测 v2 — 安装说明

基于 Sage 原版（huskydsb/Shadowrocket）改进。原版前端图标全是 Wikimedia / GitHub 外链，容易加载失败；AI 只有 ChatGPT；Netflix 只测一个片名，分不清全库还是仅自制。

## 文件清单

| 文件 | 说明 |
|---|---|
| `front-end-v2.js` | 重写的前端页面：图标全部内联 SVG（零外链）、分组展示、卡片入场/悬停/弹窗动画、新增「一键全测」、结果按状态着色 |
| `netflix-v2.js` | Netflix 双片名检测：自制 80211492 + 非自制《绝命毒师》70143836，区分完整全库 / 仅自制 / 不支持，保留地区旗帜 |
| `muse.js` | 新增：Muse（muse.ai）检测 |
| `claude.js` | 新增：Claude（claude.ai）检测 |
| `gemini.js` | 新增：Gemini（gemini.google.com）检测 |
| `流媒体解锁测试-v2.module` | v2 模块文件（含新增的 Muse / Claude / Gemini） |

## 第 1 步：把 5 个 JS 文件传到网上

Shadowrocket 的模块只能从网址加载 JS，不能读手机本地文件，所以必须先托管：

1. 在 GitHub 新建一个公开仓库（比如 `my-shadowrocket`），把 `v2/` 里的 5 个 `.js` 文件传上去；
2. 每个文件的 raw 链接格式是：
   `https://raw.githubusercontent.com/你的用户名/你的仓库/main/streaming-test/v2/front-end-v2.js`
   （把 `main` 换成你的默认分支名，如果是 `master` 就改成 `master`）
3. 浏览器打开每个 raw 链接确认能看到代码，再继续。

也可以用 Cloudflare Pages / Vercel / 自己的服务器托管，只要是 `https://` 能直接访问的链接就行。

## 第 2 步：改模块里的占位地址

用文本编辑器打开 `流媒体解锁测试-v2.module`，把里面所有的

```
https://raw.githubusercontent.com/你的GitHub用户名/你的仓库名/main/streaming-test/v2/
```

替换成你第 1 步的真实地址前缀。共 5 处要换：`front-end-v2.js`、`netflix-v2.js`、`muse.js`、`claude.js`、`gemini.js`（其他服务沿用 Sage 原版地址，不用动）。

改完把这个 `.module` 文件也传到同一个仓库，拿到它的 raw 链接。

## 第 3 步：安装模块

1. 先在 Shadowrocket 里**关闭或删除旧版「流媒体解锁测试」模块**，避免两个模块抢 `streaming.test`；
2. 打开 Shadowrocket → 配置 → 模块 → 右上角 `+` → 粘贴第 2 步得到的 `.module` raw 链接 → 安装；
3. 确认模块已开启（开关打开），并且当前配置的 HTTPS 解密已开启、证书已信任（原版模块的要求，v2 一样）。

## 第 4 步：打开检测页面

1. 手机上开启小火箭（选一个要测试的节点）；
2. Safari 打开 `https://streaming.test/`；
3. 点任意卡片单独测，或点顶部「一键全测」全部测完看汇总。

## 结果怎么看

- ✅ 可用 / 🎉 完整支持：该服务能正常用
- ⚠️ 部分可用 / 仅支持自制剧：Netflix 只能看自制剧，非自制授权片看不了（片库不全）
- ❌ 不可用 / 🚫 未支持：该节点打不开这个服务，换个节点再测

Netflix 结果会明确写出：自制剧能看 / 非自制也能看 / 全库还是部分库，以及地区旗帜（如 🇺🇸 US）。
