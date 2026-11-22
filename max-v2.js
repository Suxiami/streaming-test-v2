// HBO Max 解锁检测 v2：测 max.com 能不能打开
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 要求首页前 10KB 里必须有 "userCountry":"XX"，页面结构一变就判
//      “地区信息缺失 ❌”，明明能打开也显示未解锁
//   3. 台湾用 🇹🇼，用户要求用 🇨🇳
// v2 规则：200 且能拿到页面 = 可用；地区能取到就显示，取不到显示“地区未知”
//   也不判失败；只有 403 或明确的地区不可用提示才判失败
$httpClient.get({
  url: 'https://www.max.com/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  }
}, function (error, response, body) {
  function done(status, message) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
  }
  if (error) {
    done('failed', 'HBO Max：连接失败');
    return;
  }
  var data = body || '';
  var lower = data.toLowerCase();
  if (response.status === 403 ||
      lower.indexOf('not available in your country') !== -1 ||
      lower.indexOf('is not available in your country') !== -1 ||
      lower.indexOf('max is not available') !== -1) {
    done('failed', 'HBO Max：该服务在您所在的地区不可用');
    return;
  }
  if (response.status === 200 && data.length > 5000) {
    // 地区多试几种取法，取不到也不判失败
    var m = data.match(/"userCountry"\s*:\s*"([A-Za-z]{2})"/) ||
            data.match(/"countryCode"\s*:\s*"([A-Za-z]{2})"/) ||
            data.match(/"country"\s*:\s*"([A-Za-z]{2})"/);
    var region = m ? m[1].toUpperCase() : '';
    var flag = '';
    if (region) {
      if (region === 'TW') flag = '🇨🇳';
      else if (region === 'US') flag = '🇺🇸';
      else if (region === 'HK') flag = '🇭🇰';
      else if (region === 'SG') flag = '🇸🇬';
      else if (region === 'JP') flag = '🇯🇵';
      else flag = '🌍';
    }
    done('success', 'HBO Max：可用' + (region ? '（地区：' + flag + region + '）' : '（地区未知）'));
    return;
  }
  done('failed', 'HBO Max：不可用（状态码 ' + response.status + '）');
});
