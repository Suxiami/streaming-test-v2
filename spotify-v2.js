// Spotify 解锁检测 v2：测 open.spotify.com 能不能打开
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 用一个写死的假账号去调注册接口，只有返回码恰好是 311 才算可用，
//      接口稍有变化就判不可用
//   3. 还要额外调价格接口和 ipinfo.io 查 IP，任何一步失败整个检测就报错；
//      价格跟“能不能用 Spotify”根本没关系
//   4. 台湾被写成 WS（萨摩亚旗），不对
// v2 规则：能打开 open.spotify.com 首页 = 可用；地区能取到就显示，取不到也不判失败
$httpClient.get({
  url: 'https://open.spotify.com/',
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
    done('failed', 'Spotify：连接失败');
    return;
  }
  var body = data || '';
  var lower = body.toLowerCase();
  if (response.status === 403 ||
      lower.indexOf('not available in your country') !== -1 ||
      lower.indexOf('is not available in your country') !== -1) {
    done('failed', 'Spotify：该服务在您所在的地区不可用');
    return;
  }
  if (response.status === 200 && body.length > 5000) {
    // 尽量取地区，取不到也不影响“可用”的结论
    var m = body.match(/"country"\s*:\s*"([A-Za-z]{2})"/) ||
            body.match(/spotify\.com\/([a-z]{2})[\/\?"]/i);
    var region = m ? m[1].toUpperCase() : '';
    if (region === 'TW') region = 'TW 🇨🇳';
    done('success', 'Spotify：可用' + (region ? '（地区：' + region + '）' : ''));
    return;
  }
  done('failed', 'Spotify：不可用（状态码 ' + response.status + '）');
});
