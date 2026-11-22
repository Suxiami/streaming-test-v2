// YouTube 解锁检测 v2.6：只测“能不能打开看视频”，不测 Premium
// 之前 generate_204 探针在 Shadowrocket 的 $httpClient 里不稳定，
// 改回最简单的办法：直接请求首页，能拿到响应就算通。

var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
var HEADERS = {
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': UA
};

function ytDone(status, message) {
  $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
}

$httpClient.get({ url: 'https://www.youtube.com/', headers: HEADERS, timeout: 15000 }, function (error, response, data) {
  if (error) {
    ytDone('failed', 'YouTube：连接失败');
    return;
  }
  var body = data || '';
  // 明确的中国 IP 跳转
  if (body.indexOf('www.google.cn') !== -1) {
    ytDone('failed', 'YouTube：不可用（中国地区）');
    return;
  }
  if (/not available in your country/i.test(body)) {
    ytDone('failed', 'YouTube：不可用（地区不可用）');
    return;
  }
  var st = response ? response.status : 0;
  // 2xx / 3xx 都算能打开（303 跳 consent 页也算通，视频能看就行）
  if ((st >= 200 && st < 400)) {
    var m = body.match(/"INNERTUBE_CONTEXT_GL"\s*:\s*"([^"]+)"/);
    var region = m ? m[1] : '';
    ytDone('success', 'YouTube：可用' + (region ? '（地区：' + region + '）' : ''));
  } else if (st === 403 || st === 429) {
    ytDone('failed', 'YouTube：不可用（被拒绝，状态码 ' + st + '）');
  } else {
    ytDone('failed', 'YouTube：不可用（状态码 ' + st + '）');
  }
});
