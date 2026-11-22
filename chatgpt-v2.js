// ChatGPT 解锁检测 v2：测普通能不能打开 chatgpt.com
// 原版误判：
//   1. 第二步请求 ios.chat.openai.com 后，只要响应正文里出现 'vpn' 这三个字母
//      （页面 JS、帮助文字里很常见）就判“VPN 限制”，能用的节点也被判不可用
//   2. user-agent 传空字符串，容易被风控；两个请求都没有 timeout
// v2 规则：一次请求 chatgpt.com 首页，200 且没有明确的地区不可用提示 = 可用
$httpClient.get({
  url: 'https://chatgpt.com/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  }
}, function (error, response, data) {
  function done(status, message) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
  }
  if (error) {
    done('failed', 'ChatGPT：连接失败');
    return;
  }
  var body = (data || '').toLowerCase();
  // 只有明确的地区不可用提示才判失败，不再拿 'vpn' 这种通用词做判断
  var blocked = body.indexOf('unsupported_country') !== -1 ||
                body.indexOf('not available in your country') !== -1 ||
                body.indexOf('is not available in your country') !== -1 ||
                body.indexOf('country is not supported') !== -1 ||
                body.indexOf('openai is not available') !== -1;
  if (response.status === 403 || blocked) {
    done('failed', 'ChatGPT：该服务在您所在的地区不可用');
    return;
  }
  // 200 且能拿到页面（包括跳到登录页也算能用）= 可用
  if (response.status === 200 && (data || '').length > 1000) {
    done('success', 'ChatGPT：可用');
    return;
  }
  done('failed', 'ChatGPT：不可用（状态码 ' + response.status + '）');
});
