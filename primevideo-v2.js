// Prime Video 解锁检测 v2：测 primevideo.com 能不能打开
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 要求页面里必须有 "currentTerritory":"XX"，结构一变就判“检测异常”
//   3. 只要页面任何地方出现 isServiceRestricted 这个字符串就判“服务受限”
//      ——这个字符串经常出现在页面 JS 里描述其他地区的情况
//   4. 台湾用 🇹🇼，用户要求用 🇨🇳
// v2 规则：200 且能拿到页面 = 可用；地区能取到就显示，取不到也不判失败；
//   只有明确的地区不可用提示才判失败
$httpClient.get({
  url: 'https://www.primevideo.com/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 PrimeVideo/1.0'
  }
}, function (error, response, body) {
  function done(status, message) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
  }
  if (error) {
    done('failed', 'Prime Video：连接失败');
    return;
  }
  var data = body || '';
  var lower = data.toLowerCase();
  if (response.status === 403 ||
      lower.indexOf('not available in your country') !== -1 ||
      lower.indexOf('is not available in your country') !== -1 ||
      lower.indexOf('prime video is not available') !== -1) {
    done('failed', 'Prime Video：该服务在您所在的地区不可用');
    return;
  }
  if (response.status === 200 && data.length > 5000) {
    var m = data.match(/"currentTerritory"\s*:\s*"([A-Za-z]{2})"/) ||
            data.match(/"territory"\s*:\s*"([A-Za-z]{2})"/) ||
            data.match(/"countryCode"\s*:\s*"([A-Za-z]{2})"/);
    var region = m ? m[1].toUpperCase() : '';
    var flag = region === 'TW' ? '🇨🇳' : (region ? '🌍' : '');
    done('success', 'Prime Video：可用' + (region ? '（地区：' + flag + region + '）' : '（地区未知）'));
    return;
  }
  done('failed', 'Prime Video：不可用（状态码 ' + response.status + '）');
});
