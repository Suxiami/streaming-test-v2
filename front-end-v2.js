// 流媒体与 AI 解锁检测 v2 前端（v2.1 修 bug 版）
// 相对 v2.0 的改动：
// 1. 卡片不再由 JS 动态生成，16 个卡片全部写成静态 HTML，
// 即使内联 JS 出任何问题，卡片照样显示，单个测试照样能点
// 2. 按钮改用内联 onclick="runAllTests()"，不再依赖
// 脚本末尾的 addEventListener；runTest / 关闭 / 复制同样改内联 onclick
// 3. fetch 加 20 秒超时（Promise.race），runTest 包 try/catch，
// runAllTests 全程 try/catch + 链尾 catch，任何失败都恢复按钮状态
// 4. 图标仍为内联 SVG（零外链），CSS 动画、弹窗、复制功能全部保留
const html = `
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0f172a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>流媒体与 AI 解锁检测</title>
<style>
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent;}
body {
font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif;
background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #0c4a6e 100%);
background-attachment: fixed;
margin: 0;
padding: 0;
display: flex;
flex-direction: column;
align-items: center;
min-height: 100vh;
color: #f1f5f9;
}
.header { text-align: center; margin: 36px 16px 8px; animation: fadeDown.6s ease both;}
.header h1 {
font-size: 30px;
font-weight: 800;
margin: 0;
background: linear-gradient(90deg, #f472b6, #a78bfa, #38bdf8, #34d399);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
letter-spacing: 1px;
}
.header p { margin: 10px 0 0; font-size: 14px; color: #94a3b8;}
.test-all-btn {
margin: 22px 0 4px;
padding: 13px 34px;
font-size: 17px;
font-weight: 700;
color: #fff;
border: none;
border-radius: 999px;
cursor: pointer;
background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef);
background-size: 200% 100%;
box-shadow: 0 8px 24px rgba(139, 92, 246,.45);
transition: transform.25s ease, box-shadow.25s ease;
animation: fadeDown.6s.1s ease both, gradientMove 4s linear infinite;
}
.test-all-btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 12px 32px rgba(139, 92, 246,.6);}
.test-all-btn:active { transform: scale(.97);}
.test-all-btn:disabled { opacity:.6; cursor: wait; transform: none;}
.section { width: 92%; max-width: 1000px; margin-top: 26px; animation: fadeUp.6s ease both;}
.section h2 {
font-size: 17px;
font-weight: 700;
color: #e2e8f0;
margin: 0 4px 12px;
display: flex;
align-items: center;
gap: 8px;
}
.section h2::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(148,163,184,.5), transparent);}
.container {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
gap: 16px;
}
@media (max-width: 480px) {
.container { grid-template-columns: repeat(2, minmax(120px, 1fr)); gap: 13px;}
.header h1 { font-size: 25px;}
}
.module {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
border-radius: 18px;
background: rgba(255, 255, 255,.08);
border: 1px solid rgba(255, 255, 255,.14);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
padding: 22px 10px 18px;
box-shadow: 0 4px 16px rgba(0, 0, 0,.25);
cursor: pointer;
transition: transform.3s cubic-bezier(.34, 1.56,.64, 1), box-shadow.3s ease, background.3s ease, border-color.3s ease;
aspect-ratio: 1 / 1;
animation: fadeUp.55s cubic-bezier(.22, 1,.36, 1) both;
}
.module:hover,.module:active {
transform: translateY(-6px) scale(1.04);
background: rgba(255, 255, 255,.14);
border-color: rgba(255, 255, 255,.35);
box-shadow: 0 14px 30px rgba(0, 0, 0,.4), 0 0 0 1px rgba(167, 139, 250,.35), 0 0 24px rgba(139, 92, 246,.35);
}
.module.icon { width: 64px; height: 64px; margin-bottom: 13px; filter: drop-shadow(0 4px 10px rgba(0,0,0,.35)); transition: transform.3s ease;}
.module:hover.icon { transform: scale(1.12) rotate(-3deg);}
.module.icon svg { width: 100%; height: 100%; display: block;}
.module span { font-size: 16px; font-weight: 600; color: #f1f5f9; text-align: center;}
.module.dot {
width: 8px; height: 8px; border-radius: 50%;
background: #64748b; margin-top: 9px;
transition: background.3s ease, box-shadow.3s ease;
}
.module.dot.ok { background: #22c55e; box-shadow: 0 0 8px #22c55e;}
.module.dot.warn { background: #f59e0b; box-shadow: 0 0 8px #f59e0b;}
.module.dot.fail { background: #ef4444; box-shadow: 0 0 8px #ef4444;}
.footer { margin: 34px 16px 40px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.8;}
#result-popup {
position: fixed;
top: 50%; left: 50%;
transform: translate(-50%, -50%);
width: 86%;
max-width: 560px;
max-height: 82vh;
overflow-y: auto;
background: rgba(30, 27, 75,.92);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border-radius: 22px;
border: 1px solid rgba(255, 255, 255,.2);
box-shadow: 0 24px 60px rgba(0, 0, 0,.55);
padding: 24px 22px;
display: none;
z-index: 1000;
color: #f1f5f9;
}
#result-popup.show { display: block; animation: popIn.28s cubic-bezier(.34, 1.56,.64, 1) both;}
#result-popup h2 { margin: 0 0 6px; font-size: 20px; text-align: center;}
#popup-badge { text-align: center; margin-bottom: 12px;}
#popup-badge span {
display: inline-block;
padding: 4px 14px;
border-radius: 999px;
font-size: 13px;
font-weight: 700;
}
#popup-badge span.ok { background: rgba(34, 197, 94,.2); color: #4ade80; border: 1px solid rgba(34, 197, 94,.5);}
#popup-badge span.warn { background: rgba(245, 158, 11,.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11,.5);}
#popup-badge span.fail { background: rgba(239, 68, 68,.2); color: #f87171; border: 1px solid rgba(239, 68, 68,.5);}
#popup-badge span.loading { background: rgba(56, 189, 248,.15); color: #7dd3fc; border: 1px solid rgba(56, 189, 248,.4);}
#popup-message { margin: 0 0 20px; font-size: 15px; line-height: 1.9; text-align: center; color: #cbd5e1; white-space: pre-line;}
#popup-message.summary-row {
display: flex; justify-content: space-between; align-items: center;
text-align: left; padding: 9px 4px;
border-bottom: 1px solid rgba(255, 255, 255,.08);
font-size: 14px;
}
#popup-message.summary-row:last-child { border-bottom: none;}
.spinner {
width: 34px; height: 34px; margin: 14px auto;
border: 3px solid rgba(255, 255, 255,.2);
border-top-color: #a78bfa;
border-radius: 50%;
animation: spin.8s linear infinite;
}
.buttons { display: flex; justify-content: center; gap: 16px;}
#close-btn, #copy-btn {
border: none; color: #fff;
padding: 11px 34px; font-size: 16px; font-weight: 600;
border-radius: 12px; cursor: pointer;
transition: transform.2s ease, box-shadow.2s ease;
}
#close-btn { background: linear-gradient(135deg, #64748b, #475569); box-shadow: 0 4px 12px rgba(0,0,0,.3);}
#copy-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 14px rgba(99, 102, 241,.45);}
#close-btn:hover, #copy-btn:hover { transform: translateY(-2px);}
#close-btn:active, #copy-btn:active { transform: scale(.96);}
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px);} to { opacity: 1; transform: translateY(0);}}
@keyframes fadeDown { from { opacity: 0; transform: translateY(-14px);} to { opacity: 1; transform: translateY(0);}}
@keyframes popIn { from { opacity: 0; transform: translate(-50%, -48%) scale(.92);} to { opacity: 1; transform: translate(-50%, -50%) scale(1);}}
@keyframes spin { to { transform: rotate(360deg);}}
@keyframes gradientMove { 0% { background-position: 0% 50%;} 50% { background-position: 100% 50%;} 100% { background-position: 0% 50%;}}
@media (prefers-color-scheme: light) {
body { background: linear-gradient(160deg, #e0e7ff 0%, #fdf4ff 50%, #cffafe 100%); color: #1e293b;}
.header p { color: #64748b;}
.section h2 { color: #334155;}
.module { background: rgba(255, 255, 255,.75); border-color: rgba(15, 23, 42,.08); box-shadow: 0 4px 16px rgba(15, 23, 42,.1);}
.module:hover,.module:active { background: rgba(255, 255, 255,.95); box-shadow: 0 14px 30px rgba(15, 23, 42,.18), 0 0 24px rgba(139, 92, 246,.25);}
.module span { color: #1e293b;}
#result-popup { background: rgba(255, 255, 255,.95); color: #1e293b; border-color: rgba(15, 23, 42,.1);}
#result-popup h2 { color: #0f172a;}
#popup-message { color: #475569;}
#popup-message.summary-row { border-bottom-color: rgba(15, 23, 42,.08);}
.footer { color: #94a3b8;}
}
</style>
</head>
<body>
<div class="header">
<h1>流媒体与 AI 解锁检测</h1>
<p>点击卡片测试当前节点 · 解锁结果以实际访问为准</p>
</div>

<button class="test-all-btn" id="test-all-btn" onclick="runAllTests()">一键全测</button>

<div id="sections">
<div class="section" style="animation-delay:0ms">
<h2>AI 助手</h2>
<div class="container">
<div class="module" style="animation-delay:0ms" onclick="runTest('Muse', 'muse')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FF6B35"/><text x="32" y="43" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="Arial, sans-serif">M</text></svg></div><span>Muse</span><div class="dot" id="dot-muse"></div></div>
<div class="module" style="animation-delay:55ms" onclick="runTest('ChatGPT', 'chatgpt')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#10A37F"/><text x="32" y="39" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="Arial, sans-serif">GPT</text></svg></div><span>ChatGPT</span><div class="dot" id="dot-chatgpt"></div></div>
<div class="module" style="animation-delay:110ms" onclick="runTest('Claude', 'claude')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#D97757"/><text x="32" y="43" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="Arial, sans-serif">C</text></svg></div><span>Claude</span><div class="dot" id="dot-claude"></div></div>
<div class="module" style="animation-delay:165ms" onclick="runTest('Gemini', 'gemini')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1A73E8"/><path d="M32 10 L37 27 L54 32 L37 37 L32 54 L27 37 L10 32 L27 27 Z" fill="#fff"/></svg></div><span>Gemini</span><div class="dot" id="dot-gemini"></div></div>
</div>
</div>
<div class="section" style="animation-delay:120ms">
<h2>流媒体</h2>
<div class="container">
<div class="module" style="animation-delay:0ms" onclick="runTest('YouTube', 'youtube')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FF0000"/><path d="M26 22 L46 32 L26 42 Z" fill="#fff"/></svg></div><span>YouTube</span><div class="dot" id="dot-youtube"></div></div>
<div class="module" style="animation-delay:55ms" onclick="runTest('Netflix', 'netflix')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#141414"/><text x="32" y="43" text-anchor="middle" font-size="34" font-weight="900" fill="#E50914" font-family="Arial, sans-serif">N</text></svg></div><span>Netflix</span><div class="dot" id="dot-netflix"></div></div>
<div class="module" style="animation-delay:110ms" onclick="runTest('Disney+', 'disney')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#113CCF"/><text x="32" y="40" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="Arial, sans-serif">D+</text></svg></div><span>Disney+</span><div class="dot" id="dot-disney"></div></div>
<div class="module" style="animation-delay:165ms" onclick="runTest('Spotify', 'spotify')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1DB954"/><circle cx="32" cy="32" r="17" fill="none" stroke="#fff" stroke-width="3"/><path d="M23 27 Q32 23 41 27" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M24 33 Q32 29 40 33" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M25 39 Q32 36 39 39" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg></div><span>Spotify</span><div class="dot" id="dot-spotify"></div></div>
<div class="module" style="animation-delay:220ms" onclick="runTest('HBO Max', 'max')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#002BE7"/><text x="32" y="39" text-anchor="middle" font-size="17" font-weight="900" fill="#fff" font-family="Arial, sans-serif">MAX</text></svg></div><span>HBO Max</span><div class="dot" id="dot-max"></div></div>
<div class="module" style="animation-delay:275ms" onclick="runTest('PrimeVideo', 'primevideo')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#00A8E1"/><path d="M24 22 L40 32 L24 42 Z" fill="#fff"/><text x="32" y="54" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Arial, sans-serif">prime</text></svg></div><span>PrimeVideo</span><div class="dot" id="dot-primevideo"></div></div>
</div>
</div>
<div class="section" style="animation-delay:240ms">
<h2>其他服务</h2>
<div class="container">
<div class="module" style="animation-delay:0ms" onclick="runTest('TikTok', 'tiktok')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#000000"/><text x="32" y="44" text-anchor="middle" font-size="36" font-weight="700" fill="#fff" font-family="Arial, sans-serif">♪</text></svg></div><span>TikTok</span><div class="dot" id="dot-tiktok"></div></div>
<div class="module" style="animation-delay:55ms" onclick="runTest('Bing', 'bing')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#00809D"/><text x="32" y="43" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="Arial, sans-serif">B</text></svg></div><span>Bing</span><div class="dot" id="dot-bing"></div></div>
<div class="module" style="animation-delay:110ms" onclick="runTest('Bilibili', 'bilibili')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#00A1D6"/><text x="32" y="39" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="Arial, sans-serif">bili</text></svg></div><span>Bilibili</span><div class="dot" id="dot-bilibili"></div></div>
<div class="module" style="animation-delay:165ms" onclick="runTest('Steam', 'steam')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1B2838"/><circle cx="32" cy="32" r="16" fill="none" stroke="#fff" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#fff"/><circle cx="44" cy="20" r="3.5" fill="#fff"/></svg></div><span>Steam</span><div class="dot" id="dot-steam"></div></div>
<div class="module" style="animation-delay:220ms" onclick="runTest('Google Play', 'googleplay')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#01875F"/><path d="M25 20 L45 32 L25 44 Z" fill="#fff"/></svg></div><span>Google Play</span><div class="dot" id="dot-googleplay"></div></div>
<div class="module" style="animation-delay:275ms" onclick="runTest('Wikipedia', 'wikipedia')"><div class="icon"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/><text x="32" y="43" text-anchor="middle" font-size="32" font-weight="900" fill="#1E293B" font-family="Arial, sans-serif">W</text></svg></div><span>Wikipedia</span><div class="dot" id="dot-wikipedia"></div></div>
</div>
</div>
</div>

<div class="footer">Netflix 区分「自制剧 / 非自制 / 全库」· AI 覆盖 Muse / ChatGPT / Claude / Gemini<br>切换节点后重新测试，结果会随节点变化</div>

<div id="result-popup">
<h2 id="popup-title"></h2>
<div id="popup-badge"></div>
<p id="popup-message"></p>
<div class="buttons">
<button id="close-btn" onclick="hidePopup()">关闭</button>
<button id="copy-btn" onclick="copyResult()">复制</button>
</div>
</div>

<script>
var baseUrl = 'https://streaming.test';

// 服务列表（仅供一键全测顺序调用；卡片已是静态 HTML，不再由 JS 生成）
var services = [
{ name: 'Muse', endpoint: 'muse'},
{ name: 'ChatGPT', endpoint: 'chatgpt'},
{ name: 'Claude', endpoint: 'claude'},
{ name: 'Gemini', endpoint: 'gemini'},
{ name: 'YouTube', endpoint: 'youtube'},
{ name: 'Netflix', endpoint: 'netflix'},
{ name: 'Disney+', endpoint: 'disney'},
{ name: 'Spotify', endpoint: 'spotify'},
{ name: 'HBO Max', endpoint: 'max'},
{ name: 'PrimeVideo', endpoint: 'primevideo'},
{ name: 'TikTok', endpoint: 'tiktok'},
{ name: 'Bing', endpoint: 'bing'},
{ name: 'Bilibili', endpoint: 'bilibili'},
{ name: 'Steam', endpoint: 'steam'},
{ name: 'Google Play', endpoint: 'googleplay'},
{ name: 'Wikipedia', endpoint: 'wikipedia'}
];

function badgeFor(status) {
if (status === 'success') return '<span class="ok">可用</span>';
if (status === 'partial') return '<span class="warn">部分可用</span>';
if (status === 'failed') return '<span class="fail">不可用</span>';
return '';
}

function dotClassFor(status) {
if (status === 'success') return 'ok';
if (status === 'partial') return 'warn';
if (status === 'failed') return 'fail';
return '';
}

function setDot(endpoint, status) {
var dot = document.getElementById('dot-' + endpoint);
if (dot) dot.className = 'dot ' + dotClassFor(status);
}

function showPopup(title, badgeHtml, messageHtml) {
var t = document.getElementById('popup-title');
var b = document.getElementById('popup-badge');
var m = document.getElementById('popup-message');
var p = document.getElementById('result-popup');
if (!t ||!b ||!m ||!p) return;
t.textContent = title;
b.innerHTML = badgeHtml;
m.innerHTML = messageHtml;
p.classList.add('show');
}

function hidePopup() {
var p = document.getElementById('result-popup');
if (p) p.classList.remove('show');
}

function copyResult() {
var m = document.getElementById('popup-message');
var text = m? m.textContent: '';
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(hidePopup).catch(function () { alert('复制失败!');});
} else {
var ta = document.createElement('textarea');
ta.value = text;
document.body.appendChild(ta);
ta.select();
try { document.execCommand('copy'); hidePopup();} catch (e) { alert('复制失败!');}
document.body.removeChild(ta);
}
}

// 带 20 秒超时的请求：某个服务端点挂起时也不会让弹窗永远转圈
function fetchResult(endpoint) {
var req = fetch(baseUrl + '/' + endpoint, { method: 'GET'}).then(function (response) {
if (!response.ok) throw new Error('请求失败');
return response.json();
});
var timeout = new Promise(function (resolve, reject) {
setTimeout(function () { reject(new Error('请求超时'));}, 20000);
});
return Promise.race([req, timeout]);
}

function runTest(name, endpoint) {
try {
showPopup('正在测试 ' + name, '<span class="loading">检测中…</span>', '<div class="spinner"></div>请稍候…');
fetchResult(endpoint).then(function (result) {
var msg = (result.message || '未知结果').replace(/\n/g, '<br>');
showPopup(name + ' 测试结果', badgeFor(result.status), msg);
setDot(endpoint, result.status);
}).catch(function () {
showPopup(name + ' 测试失败', '<span class="fail">检测失败</span>', '请检查网络连接或分流规则');
setDot(endpoint, 'failed');
});
} catch (e) {
showPopup(name + ' 测试失败', '<span class="fail">检测失败</span>', '请检查网络连接或分流规则');
setDot(endpoint, 'failed');
}
}

var testingAll = false;
function runAllTests() {
if (testingAll) return;
testingAll = true;
var btn = document.getElementById('test-all-btn');
if (btn) { btn.disabled = true; btn.textContent = '检测中…';}
function restoreBtn() {
testingAll = false;
if (btn) { btn.disabled = false; btn.textContent = '一键全测';}
}
try {
showPopup('一键全测', '<span class="loading">正在逐个检测，请稍候…</span>', '<div class="spinner"></div>正在测试 ' + services.length + ' 个服务…');
} catch (e) {}
var results = [];
var chain = Promise.resolve();
services.forEach(function (service) {
chain = chain.then(function () {
var p;
try {
p = fetchResult(service.endpoint);
} catch (e) {
p = Promise.reject(new Error('fetch 不可用'));
}
return p.then(function (result) {
results.push({ name: service.name, status: result.status});
setDot(service.endpoint, result.status);
}).catch(function () {
results.push({ name: service.name, status: 'failed'});
setDot(service.endpoint, 'failed');
}).then(function () {
return new Promise(function (r) { setTimeout(r, 250);});
});
});
});
chain.then(function () {
var okCount = results.filter(function (x) { return x.status === 'success';}).length;
var html = '';
results.forEach(function (x) {
var mark = x.status === 'success'? '✅': (x.status === 'partial'? '⚠️': '❌');
html += '<div class="summary-row"><span>' + x.name + '</span><span>' + mark + '</span></div>';
});
var badge = '<span class="' + (okCount === results.length? 'ok': (okCount > 0? 'warn': 'fail')) + '">可用 ' + okCount + ' / ' + results.length + '</span>';
showPopup('一键全测结果', badge, html);
restoreBtn();
}).catch(function () {
showPopup('一键全测失败', '<span class="fail">检测失败</span>', '请检查网络连接或分流规则');
restoreBtn();
});
}

// 点击弹窗背景关闭（非关键逻辑，出错也不影响卡片和按钮）
try {
var popupEl = document.getElementById('result-popup');
if (popupEl) popupEl.addEventListener('click', function (e) { if (e.target === popupEl) hidePopup();});
} catch (e) {}
</script>
</body>
</html>
`;

$done({
response: {
status: 200,
headers: { 'Content-Type': 'text/html;charset=UTF-8'},
body: html
}
});
