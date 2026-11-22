// Wikipedia 解锁检测 v2：测 wikipedia.org 能不能打开阅读
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 测的是“能不能编辑”（打开沙盒编辑页，看有没有 Banned 字样），不是
//      “能不能看”——代理/VPN 的 IP 段经常被禁编辑，但照样能正常读维基，
//      结果就是明明能用却显示“不可编辑 ❌”
// v2 规则：能打开 wikipedia.org 首页 = 可用；只测阅读，不测编辑
$httpClient.get({
  url: 'https://www.wikipedia.org/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  }
}, function (error, response, data) {
  function done(status, message) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
  }
  if (error) {
    done('failed', 'Wikipedia：连接失败');
    return;
  }
  var body = data || '';
  if (response.status === 200 && body.length > 5000) {
    done('success', 'Wikipedia：可用');
    return;
  }
  done('failed', 'Wikipedia：不可用（状态码 ' + response.status + '）');
});
