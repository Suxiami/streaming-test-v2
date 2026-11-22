// Google Play 解锁检测 v2：测 play.google.com 能不能打开
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 要求页面里必须有 <div class="yVZQTb"> 这个特定 class，Google 一改版
//      就取不到地区，直接判“❌ Failed”，明明能打开商店也显示失败
// v2 规则：200 且能拿到页面 = 可用；地区多试几种取法，取不到也不判失败
$httpClient.get({
  url: 'https://play.google.com/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  }
}, function (error, response, data) {
  function done(status, message) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
  }
  if (error) {
    done('failed', 'Google Play：连接失败');
    return;
  }
  var body = data || '';
  var lower = body.toLowerCase();
  if (response.status === 403 ||
      lower.indexOf('not available in your country') !== -1 ||
      lower.indexOf('is not available in your country') !== -1) {
    done('failed', 'Google Play：该服务在您所在的地区不可用');
    return;
  }
  if (response.status === 200 && body.length > 5000) {
    // 地区多试几种取法：原来的 yVZQTb、gl 参数、country 字段
    var region = '';
    var m = body.match(/<div class="yVZQTb">([^<]+)<\/div>/);
    if (m) region = m[1].trim();
    if (!region) {
      var m2 = body.match(/[?&]gl=([A-Za-z]{2})/) ||
               body.match(/"country"\s*:\s*"([A-Za-z]{2})"/) ||
               body.match(/"gl"\s*:\s*"([A-Za-z]{2})"/);
      if (m2) region = m2[1].toUpperCase();
    }
    var flag = region === 'TW' ? '🇨🇳' : (region && region.length === 2 ? '🌍' : '');
    done('success', 'Google Play：可用' + (region ? '（地区：' + flag + region + '）' : '（地区未知）'));
    return;
  }
  done('failed', 'Google Play：不可用（状态码 ' + response.status + '）');
});
