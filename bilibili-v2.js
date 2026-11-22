// Bilibili 解锁检测 v2：先测 b站首页能不能打开，再测大陆限定番剧
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//   2. 只测 3 个地区限定的番剧（大陆/港澳台/台湾），美国节点 3 个都看不了，
//      就全显示 ❌——但用户在美国本来就能正常打开 B 站看普通视频，
//      “能不能用 B 站”和“能不能看大陆限定番剧”是两回事
// v2 规则：首页打不开 = 不可用；首页能打开 = 至少可用；
//   再测一个大陆限定番剧，能看就是完整可用，不能看就是部分可用（能看 B 站，
//   大陆限定番剧需大陆 IP）
function done(status, message) {
  $done({ response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status, message: message }) } });
}

$httpClient.get({
  url: 'https://www.bilibili.com/',
  timeout: 15000,
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  }
}, function (error, response, data) {
  if (error) {
    done('failed', 'Bilibili：连接失败');
    return;
  }
  if (response.status !== 200 || (data || '').length < 5000) {
    done('failed', 'Bilibili：不可用（状态码 ' + response.status + '）');
    return;
  }
  // 首页能打开，再测一个大陆限定番剧，看是不是完整可用
  var session = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  $httpClient.get({
    url: 'https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&session=' + session + '&module=bangumi',
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  }, function (error2, response2, body2) {
    if (error2) {
      // 番剧接口挂了不影响“B 站能打开”的结论
      done('success', 'Bilibili：可用（番剧检测未完成）');
      return;
    }
    var m = (body2 || '').match(/"code"\s*:\s*(-?\d+)/);
    var code = m ? m[1] : null;
    if (code === '0') {
      done('success', 'Bilibili：可用，大陆限定番剧可看');
    } else if (code === '-10403') {
      done('partial', 'Bilibili：能打开，大陆限定番剧需大陆 IP');
    } else {
      done('success', 'Bilibili：可用');
    }
  });
});
