// Steam 解锁检测 v2：测 store.steampowered.com 能不能打开
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 要求响应头里必须有 steamCountry 这个 Cookie，拿不到就抛错判
//      “无法检测地区信息”——Steam 没给这个 Cookie 不代表打不开商店
//   3. 超时只有 5 秒，太短
//   4. 出错时返回 HTTP 500，前端 fetch 看到非 200 直接抛错，连 message 都看不到
// v2 规则：200 且能拿到商店页面 = 可用；地区从 Cookie 里取，取不到再从页面里找，
//   实在取不到显示“地区未知”也不判失败；$done 永远返回 200
$httpClient.get({
  url: 'https://store.steampowered.com/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, function (error, response, data) {
  function done(status, message) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
  }
  if (error) {
    done('failed', 'Steam：连接失败');
    return;
  }
  var body = data || '';
  if (response.status === 200 && body.length > 5000) {
    // 地区多试几种取法，取不到也不判失败
    var region = '';
    try {
      var cookies = response.headers['Set-Cookie'] || response.headers['set-cookie'] || '';
      var mm = String(cookies).match(/steamCountry=([A-Za-z]{2})/);
      if (mm) region = mm[1].toUpperCase();
    } catch (e) {}
    if (!region) {
      var m2 = body.match(/"countryCode"\s*:\s*"([A-Za-z]{2})"/) ||
               body.match(/g_strCountryCode\s*=\s*"([A-Za-z]{2})"/) ||
               body.match(/steamCountry=([A-Za-z]{2})/);
      if (m2) region = m2[1].toUpperCase();
    }
    var flag = region === 'TW' ? '🇨🇳' : (region ? '🌍' : '');
    done('success', 'Steam：可用' + (region ? '（地区：' + flag + region + '）' : '（地区未知）'));
    return;
  }
  done('failed', 'Steam：不可用（状态码 ' + response.status + '）');
});
