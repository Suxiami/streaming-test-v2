# 流媒体与 AI 解锁检测 v2

基于 Sage 原版（[huskydsb/Shadowrocket](https://github.com/huskydsb/Shadowrocket)）改进的 Shadowrocket 解锁检测模块。原版前端图标全是 Wikimedia / GitHub 外链，容易加载失败；AI 只有 ChatGPT；Netflix 只测一个片名，分不清全库还是仅自制。v2 全部修了。

## 改了什么

- **前端重写**：图标全部改成内联 SVG，零外链，不会再出现图标加载不出来；界面分组展示（AI 助手 / 流媒体 / 其他），卡片入场、悬停、弹窗都有动画；新增「一键全测」，点一下全部测完看汇总
- **Netflix 双片名检测**：同时测自制剧 80211492 和非自制《绝命毒师》70143836，能分清楚是完整全库、还是只能看自制、还是不支持，地区旗帜也保留
- **新增 AI 检测**：Muse、Claude、Gemini（原版只有 ChatGPT），现在 AI 是 Muse、GPT、Claude、Gemini 四个都有

## 直接安装

模块链接（复制到 Shadowrocket 里安装）：

```
https://raw.githubusercontent.com/Suxiami/streaming-test-v2/main/%E6%B5%81%E5%AA%92%E4%BD%93%E8%A7%A3%E9%94%81%E6%B5%8B%E8%AF%95-v2.module
```

步骤：

1. 先在 Shadowrocket 里关闭或删除旧版「流媒体解锁测试」模块，避免两个模块抢 `streaming.test`
2. 打开 Shadowrocket → 配置 → 模块 → 右上角 `+` → 粘贴上面这个链接 → 安装
3. 确认模块已开启，当前配置的 HTTPS 解密已开启、证书已信任

## 怎么用

1. 手机上开启小火箭，选一个要测试的节点
2. Safari 打开 `https://streaming.test/`
3. 点任意卡片单独测，或点顶部「一键全测」全部测完看汇总

## 结果怎么看

- ✅ 可用 / 🎉 完整支持：该服务能正常用
- ⚠️ 部分可用 / 仅支持自制剧：Netflix 只能看自制剧，非自制授权片看不了（片库不全）
- ❌ 不可用 / 🚫 未支持：该节点打不开这个服务，换个节点再测

Netflix 结果会明确写出：自制剧能看 / 非自制也能看 / 全库还是部分库，以及地区旗帜（如 🇺🇸 US）。

## 文件清单

| 文件 | 说明 |
|---|---|
| `front-end-v2.js` | 重写的前端页面 |
| `netflix-v2.js` | Netflix 双片名检测 |
| `muse.js` | Muse（muse.ai）检测 |
| `claude.js` | Claude（claude.ai）检测 |
| `gemini.js` | Gemini（gemini.google.com）检测 |
| `流媒体解锁测试-v2.module` | v2 模块文件 |

## 声明

本项目基于 Sage（huskydsb）的原版流媒体解锁测试模块修改，原仓库：https://github.com/huskydsb/Shadowrocket 。原版作者保留原有权利，本项目仅做功能完善，不作商业用途。
