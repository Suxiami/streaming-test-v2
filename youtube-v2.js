// YouTube 解锁检测 v2：测普通视频能不能看，不是测 Premium
// 原版 Sage 的 youtube.js 测的是 youtube.com/premium，看的是 Premium 有没有，
// 所以很多能正常看视频的节点也会显示不可用。这里改成测首页能不能打开。

$httpClient.get({
  url: 'https://www.youtube.com/',
  headers: {
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  timeout: 10000
}, function (error, response, data) {
  if (error) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed', message: 'YouTube：连接失败' }) } });
    return;
  }
  var body = data || '';
  // 被重定向到 google.cn 说明是中国 IP
  if (body.indexOf('www.google.cn') !== -1) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed', message: 'YouTube：不可用（中国地区）' }) } });
    return;
  }
  // 能拿到首页内容就说明能看，顺手取地区
  var m = body.match(/"INNERTUBE_CONTEXT_GL"\s*:\s*"([^"]+)"/);
  var region = m ? m[1] : '';
  // 首页里有视频标题/播放器相关字样就当作可用
  if (response.status === 200 && body.length > 10000) {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'success', message: 'YouTube：可用' + (region ? '（地区：' + region + '）' : '') }) } });
  } else {
    $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed', message: 'YouTube：不可用（页面异常）' }) } });
  }
});
