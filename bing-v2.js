// Bing 解锁检测 v2：测 bing.com 能不能打开并正常搜索
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 台湾用 🇹🇼，用户要求用 🇨🇳
//   3. “Risky”判断跟能不能用 Bing 没关系，只是搜索设置里的一个标记，
//      却会让用户以为有问题
// v2 规则：200 且能拿到搜索页 = 可用；Bing 在中国也能用，所以 CN 不算失败；
//   地区能取到就显示，取不到也不判失败
$httpClient.get({
  url: 'https://www.bing.com/search?q=curl',
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
    done('failed', 'Bing：连接失败');
    return;
  }
  var data = body || '';
  if (response.status === 200 && data.length > 5000) {
    var region = '';
    if (data.indexOf('cn.bing.com') !== -1) {
      region = 'CN';
    } else {
      var m = data.match(/Region\s*:\s*"([^"]+)"/);
      if (m) region = m[1].toUpperCase();
    }
    var flag = region === 'TW' ? '🇨🇳' : (region === 'CN' ? '🇨🇳' : (region ? '🌍' : ''));
    done('success', 'Bing：可用' + (region ? '（地区：' + flag + region + '）' : '（地区未知）'));
    return;
  }
  done('failed', 'Bing：不可用（状态码 ' + response.status + '）');
});
