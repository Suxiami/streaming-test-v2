// YouTube 解锁检测 v2.5：只测“能不能打开看视频”，不测 Premium
// 照 unlock-check（yt1988/unlock-check）的做法：YouTube 没有可读的 Premium 信号，
// 唯一可靠的办法就是测可达性。它用的探针是 /generate_204（204 = 通）。
// 之前版本的问题：
//  1. 要求 response.status === 200，但 YouTube 对新 IP 常返回 303 跳到 consent 页面，
//     $httpClient 不一定跟跳转，于是 303 就被判“页面异常”不可用；
//  2. 要求 body.length > 10000，consent 页 / 轻量页 body 小，也被误判。
// 改法：2xx/3xx 都算通；先打 generate_204，通了再顺手请求首页取地区（尽力而为，
// 取不到地区也判可用）；只有明确的 google.cn / 地区不可用提示 / 两次都连不上才判不可用。

var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
var HEADERS = {
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': UA
};

function ytDone(status, message) {
  $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
}

function isReachableStatus(st) {
  return st === 200 || st === 204 || (st >= 301 && st <= 308);
}

function regionFrom(body) {
  var m = (body || '').match(/"INNERTUBE_CONTEXT_GL"\s*:\s*"([^"]+)"/);
  return m ? m[1] : '';
}

function isBlockedBody(body) {
  var b = body || '';
  if (b.indexOf('www.google.cn') !== -1) return '中国地区';
  if (/not available in your country/i.test(b)) return '地区不可用';
  return '';
}

// 首页兜底：generate_204 不通时再试一次首页
function tryHome() {
  $httpClient.get({ url: 'https://www.youtube.com/', headers: HEADERS, timeout: 10000 }, function (error, response, data) {
    if (error) {
      ytDone('failed', 'YouTube：连接失败');
      return;
    }
    var body = data || '';
    var blocked = isBlockedBody(body);
    if (blocked) {
      ytDone('failed', 'YouTube：不可用（' + blocked + '）');
      return;
    }
    var st = response ? response.status : 0;
    if (isReachableStatus(st)) {
      var region = regionFrom(body);
      ytDone('success', 'YouTube：可用' + (region ? '（地区：' + region + '）' : ''));
    } else if (st === 403 || st === 429) {
      ytDone('failed', 'YouTube：不可用（被拒绝，状态码 ' + st + '）');
    } else {
      ytDone('failed', 'YouTube：不可用（状态码 ' + st + '）');
    }
  });
}

$httpClient.get({ url: 'https://www.youtube.com/generate_204', headers: HEADERS, timeout: 10000 }, function (error, response, data) {
  if (!error && response && isReachableStatus(response.status)) {
    // 通了。再请求一次首页，只为取地区；取不到也算可用。
    $httpClient.get({ url: 'https://www.youtube.com/', headers: HEADERS, timeout: 8000 }, function (err2, res2, data2) {
      var body2 = data2 || '';
      var blocked = isBlockedBody(body2);
      if (blocked) {
        ytDone('failed', 'YouTube：不可用（' + blocked + '）');
        return;
      }
      var region = regionFrom(body2);
      ytDone('success', 'YouTube：可用' + (region ? '（地区：' + region + '）' : ''));
    });
    return;
  }
  // generate_204 不通（报错或 4xx/5xx），首页再试一次
  tryHome();
});
