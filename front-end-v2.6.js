// 流媒体与 AI 解锁检测 v2 前端（v2.5）
// v2.5 改动：1. 一键全测进度条+计数实时更新（之前只改标题不改徽章，0/16 看着不动）
// 2. 卡片加一行详情（地区/仅自制/可用，直接写在卡片上，照 unlock-check 的做法）
// 3. 图标改彩色方块+字母（纯 HTML/CSS，不用 SVG，彻底杜绝图标不显示）
// 4. 修 .module:hover.icon 选择器、修 #popup-message.summary-row 选择器
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
padding: 18px 10px 14px;
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
.module .icon { width: 56px; height: 56px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; color: #fff; border-radius: 14px; filter: drop-shadow(0 4px 10px rgba(0,0,0,.35)); transition: transform.3s ease;}
.module:hover .icon { transform: scale(1.12) rotate(-3deg);}
.module span { font-size: 16px; font-weight: 600; color: #f1f5f9; text-align: center;}
.module .detail { font-size: 11px; font-weight: 500; color: #94a3b8; margin-top: 3px; text-align: center; line-height: 1.3; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
.module .dot {
width: 8px; height: 8px; border-radius: 50%;
background: #64748b; margin-top: 9px;
transition: background.3s ease, box-shadow.3s ease;
}
.module .dot.ok { background: #22c55e; box-shadow: 0 0 8px #22c55e;}
.module .dot.warn { background: #f59e0b; box-shadow: 0 0 8px #f59e0b;}
.module .dot.fail { background: #ef4444; box-shadow: 0 0 8px #ef4444;}
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
#live-results .summary-row {
display: flex; justify-content: space-between; align-items: center;
text-align: left; padding: 9px 4px;
border-bottom: 1px solid rgba(255, 255, 255,.08);
font-size: 14px;
}
#live-results .summary-row:last-child { border-bottom: none;}
.progress { height: 6px; background: rgba(255,255,255,.15); border-radius: 999px; overflow: hidden; margin: 2px 0 12px;}
.progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg,#6366f1,#d946ef); border-radius: 999px; transition: width .3s ease;}
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
.module .detail { color: #64748b;}
#result-popup { background: rgba(255, 255, 255,.95); color: #1e293b; border-color: rgba(15, 23, 42,.1);}
#result-popup h2 { color: #0f172a;}
#popup-message { color: #475569;}
#live-results .summary-row { border-bottom-color: rgba(15, 23, 42,.08);}
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
<div class="module" style="animation-delay:0ms" onclick="runTest('Muse', 'muse')"><div class="icon" style="background:#FF6B35;color:#fff;font-size:28px">M</div><span>Muse</span><div class="detail" id="detail-muse">未测试</div><div class="dot" id="dot-muse"></div></div>
<div class="module" style="animation-delay:55ms" onclick="runTest('ChatGPT', 'chatgpt')"><div class="icon" style="background:#10A37F;color:#fff;font-size:17px">GPT</div><span>ChatGPT</span><div class="detail" id="detail-chatgpt">未测试</div><div class="dot" id="dot-chatgpt"></div></div>
<div class="module" style="animation-delay:110ms" onclick="runTest('Claude', 'claude')"><div class="icon" style="background:#D97757;color:#fff;font-size:28px">C</div><span>Claude</span><div class="detail" id="detail-claude">未测试</div><div class="dot" id="dot-claude"></div></div>
<div class="module" style="animation-delay:165ms" onclick="runTest('Gemini', 'gemini')"><div class="icon" style="background:#1A73E8;color:#fff;font-size:28px">✦</div><span>Gemini</span><div class="detail" id="detail-gemini">未测试</div><div class="dot" id="dot-gemini"></div></div>
</div>
</div>
<div class="section" style="animation-delay:120ms">
<h2>流媒体</h2>
<div class="container">
<div class="module" style="animation-delay:0ms" onclick="runTest('YouTube', 'youtube')"><div class="icon" style="background:#FF0000;color:#fff;font-size:26px">▶</div><span>YouTube</span><div class="detail" id="detail-youtube">未测试</div><div class="dot" id="dot-youtube"></div></div>
<div class="module" style="animation-delay:55ms" onclick="runTest('Netflix', 'netflix')"><div class="icon" style="background:#141414;color:#E50914;font-size:28px">N</div><span>Netflix</span><div class="detail" id="detail-netflix">未测试</div><div class="dot" id="dot-netflix"></div></div>
<div class="module" style="animation-delay:110ms" onclick="runTest('Disney+', 'disney')"><div class="icon" style="background:#113CCF;color:#fff;font-size:20px">D+</div><span>Disney+</span><div class="detail" id="detail-disney">未测试</div><div class="dot" id="dot-disney"></div></div>
<div class="module" style="animation-delay:165ms" onclick="runTest('Spotify', 'spotify')"><div class="icon" style="background:#1DB954;color:#fff;font-size:28px">S</div><span>Spotify</span><div class="detail" id="detail-spotify">未测试</div><div class="dot" id="dot-spotify"></div></div>
<div class="module" style="animation-delay:220ms" onclick="runTest('HBO Max', 'max')"><div class="icon" style="background:#002BE7;color:#fff;font-size:16px">MAX</div><span>HBO Max</span><div class="detail" id="detail-max">未测试</div><div class="dot" id="dot-max"></div></div>
<div class="module" style="animation-delay:275ms" onclick="runTest('PrimeVideo', 'primevideo')"><div class="icon" style="background:#00A8E1;color:#fff;font-size:28px">P</div><span>PrimeVideo</span><div class="detail" id="detail-primevideo">未测试</div><div class="dot" id="dot-primevideo"></div></div>
</div>
</div>
<div class="section" style="animation-delay:240ms">
<h2>其他服务</h2>
<div class="container">
<div class="module" style="animation-delay:0ms" onclick="runTest('TikTok', 'tiktok')"><div class="icon" style="background:#000000;color:#fff;font-size:30px">♪</div><span>TikTok</span><div class="detail" id="detail-tiktok">未测试</div><div class="dot" id="dot-tiktok"></div></div>
<div class="module" style="animation-delay:55ms" onclick="runTest('Bing', 'bing')"><div class="icon" style="background:#00809D;color:#fff;font-size:28px">B</div><span>Bing</span><div class="detail" id="detail-bing">未测试</div><div class="dot" id="dot-bing"></div></div>
<div class="module" style="animation-delay:110ms" onclick="runTest('Bilibili', 'bilibili')"><div class="icon" style="background:#00A1D6;color:#fff;font-size:15px">bili</div><span>Bilibili</span><div class="detail" id="detail-bilibili">未测试</div><div class="dot" id="dot-bilibili"></div></div>
<div class="module" style="animation-delay:165ms" onclick="runTest('Steam', 'steam')"><div class="icon" style="background:#1B2838;color:#fff;font-size:20px">St</div><span>Steam</span><div class="detail" id="detail-steam">未测试</div><div class="dot" id="dot-steam"></div></div>
<div class="module" style="animation-delay:220ms" onclick="runTest('Google Play', 'googleplay')"><div class="icon" style="background:#01875F;color:#fff;font-size:28px">G</div><span>Google Play</span><div class="detail" id="detail-googleplay">未测试</div><div class="dot" id="dot-googleplay"></div></div>
<div class="module" style="animation-delay:275ms" onclick="runTest('Wikipedia', 'wikipedia')"><div class="icon" style="background:#FFFFFF;color:#1E293B;font-size:28px">W</div><span>Wikipedia</span><div class="detail" id="detail-wikipedia">未测试</div><div class="dot" id="dot-wikipedia"></div></div>
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

var COUNTRY = { 'US': ['🇺🇸', '美国'], 'JP': ['🇯🇵', '日本'], 'SG': ['🇸🇬', '新加坡'], 'HK': ['🇭🇰', '香港'], 'TW': ['🇨🇳', '台湾'], 'KR': ['🇰🇷', '韩国'], 'GB': ['🇬🇧', '英国'], 'DE': ['🇩🇪', '德国'], 'FR': ['🇫🇷', '法国'], 'CA': ['🇨🇦', '加拿大'], 'AU': ['🇦🇺', '澳大利亚'], 'NL': ['🇳🇱', '荷兰'], 'IN': ['🇮🇳', '印度'], 'BR': ['🇧🇷', '巴西'], 'MX': ['🇲🇽', '墨西哥'], 'IT': ['🇮🇹', '意大利'], 'ES': ['🇪🇸', '西班牙'], 'TR': ['🇹🇷', '土耳其'], 'ID': ['🇮🇩', '印尼'], 'TH': ['🇹🇭', '泰国'], 'MY': ['🇲🇾', '马来西亚'], 'PH': ['🇵🇭', '菲律宾'], 'VN': ['🇻🇳', '越南'], 'AR': ['🇦🇷', '阿根廷'], 'NZ': ['🇳🇿', '新西兰'], 'CH': ['🇨🇭', '瑞士'], 'SE': ['🇸🇪', '瑞典'], 'NO': ['🇳🇴', '挪威'], 'AE': ['🇦🇪', '阿联酋'] };

function countryText(code) {
if (!code) return '';
var c = COUNTRY[code.toUpperCase()];
if (c) return c[0] + ' ' + c[1];
return code;
}

// 把检测返回的 message 提炼成卡片上的一行短字：地区 / 仅自制 / 全库 / 可用 / 不可用
// 照 unlock-check 的做法：能用的服务直接在卡片上写它看到的国家
function shortDetail(result) {
var msg = (result && result.message) || '';
if (!msg) return result.status === 'success' ? '可用' : '不可用';
// 只取第一行（弹窗里那串东西的第一行就有地区+国旗）
var firstLine = msg.split('\n')[0] || msg;
// 去掉开头的服务名前缀，比如 "Netflix: "、"YouTube："、"Muse: "
firstLine = firstLine.replace(/^[^:：]+[:：]\s*/, '');
// 如果第一行里已经有国旗，直接返回第一行
if (/[\uD83C][\uDDE6-\uDDFF]/.test(firstLine)) return firstLine;
// 否则试着从消息里提取地区代码，转成国旗+国家名
var m = msg.match(/地区[:：] *([A-Z]{2})/);
if (!m) m = msg.match(/Region: *([A-Z]{2})/);
if (m) {
var region = countryText(m[1]);
if (result.status === 'success') {
if (msg.indexOf('全库') !== -1) return region + ' · 全库';
if (msg.indexOf('仅自制') !== -1 || msg.indexOf('仅部分') !== -1) return region + ' · 仅自制';
return region;
}
if (result.status === 'partial') return region + ' · 仅部分';
return region + ' · 不可用';
}
if (result.status === 'success') return '可用';
if (result.status === 'partial') return '仅部分';
return '不可用';
}

function setDetail(endpoint, text) {
var d = document.getElementById('detail-' + endpoint);
if (d) d.textContent = text;
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
setDetail(endpoint, '检测中…');
fetchResult(endpoint).then(function (result) {
var msg = (result.message || '未知结果').replace(/\\n/g, '<br>');
showPopup(name + ' 测试结果', badgeFor(result.status), msg);
setDot(endpoint, result.status);
setDetail(endpoint, shortDetail(result));
}).catch(function () {
showPopup(name + ' 测试失败', '<span class="fail">检测失败</span>', '请检查网络连接或分流规则');
setDot(endpoint, 'failed');
setDetail(endpoint, '检测失败');
});
} catch (e) {
showPopup(name + ' 测试失败', '<span class="fail">检测失败</span>', '请检查网络连接或分流规则');
setDot(endpoint, 'failed');
setDetail(endpoint, '检测失败');
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
var results = [];
var doneCount = 0;
// 先弹出一个空的进度框，每测完一个就往里面加一行
try {
showPopup('一键全测', '<span class="loading">正在逐个检测… 0 / ' + services.length + '</span>', '<div class="progress"><div class="progress-bar" id="progress-bar"></div></div><div id="live-results"></div>');
} catch (e) {}
function appendLiveResult(name, status, msg) {
var box = document.getElementById('live-results');
if (!box) return;
var mark = status === 'success' ? '✅' : (status === 'partial' ? '⚠️' : '❌');
var row = document.createElement('div');
row.className = 'summary-row';
var left = document.createElement('span');
left.textContent = name;
var right = document.createElement('span');
right.textContent = mark + ' ' + (msg || '');
row.appendChild(left);
row.appendChild(right);
box.appendChild(row);
// 更新标题、徽章计数和进度条（之前只改标题不改徽章，用户盯着的 0/16 一直不动）
var title = document.getElementById('popup-title');
if (title) title.textContent = '一键全测 (' + doneCount + ' / ' + services.length + ')';
var badge = document.getElementById('popup-badge');
if (badge) badge.innerHTML = '<span class="loading">正在逐个检测… ' + doneCount + ' / ' + services.length + '</span>';
var bar = document.getElementById('progress-bar');
if (bar) bar.style.width = Math.round(doneCount / services.length * 100) + '%';
}
var chain = Promise.resolve();
services.forEach(function (service) {
chain = chain.then(function () {
setDetail(service.endpoint, '检测中…');
var p;
try {
p = fetchResult(service.endpoint);
} catch (e) {
p = Promise.reject(new Error('fetch 不可用'));
}
return p.then(function (result) {
doneCount++;
results.push({ name: service.name, status: result.status});
setDot(service.endpoint, result.status);
setDetail(service.endpoint, shortDetail(result));
appendLiveResult(service.name, result.status, shortDetail(result));
}).catch(function () {
doneCount++;
results.push({ name: service.name, status: 'failed'});
setDot(service.endpoint, 'failed');
setDetail(service.endpoint, '检测失败');
appendLiveResult(service.name, 'failed', '检测失败');
}).then(function () {
return new Promise(function (r) { setTimeout(r, 250);});
});
});
});
chain.then(function () {
var okCount = results.filter(function (x) { return x.status === 'success';}).length;
var badge = '<span class="' + (okCount === results.length ? 'ok' : (okCount > 0 ? 'warn' : 'fail')) + '">可用 ' + okCount + ' / ' + results.length + '</span>';
// 最后在进度列表下面加一行汇总
var box = document.getElementById('live-results');
if (box) {
var sum = document.createElement('div');
sum.className = 'summary-row';
sum.style.borderTop = '1px solid rgba(255,255,255,.2)';
sum.style.marginTop = '10px';
sum.style.paddingTop = '10px';
sum.style.fontWeight = 'bold';
var l = document.createElement('span');
l.textContent = '汇总';
var r = document.createElement('span');
r.textContent = '可用 ' + okCount + ' / ' + results.length;
sum.appendChild(l);
sum.appendChild(r);
box.appendChild(sum);
}
var title = document.getElementById('popup-title');
if (title) title.textContent = '一键全测结果';
var barDone = document.getElementById('progress-bar');
if (barDone) barDone.style.width = '100%';
var badgeEl = document.getElementById('popup-badge');
if (badgeEl) badgeEl.innerHTML = badge;
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
