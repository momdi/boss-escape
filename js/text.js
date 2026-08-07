/* ===========================================================
   텍스트 렌더러
   도트 폰트는 작은 크기에서 한글 획이 뭉개져 읽기 어렵다.
   -> 엑셀 시트와 같은 일반 UI 폰트를 캔버스 고해상도 좌표계에
      그대로 그린다. 캔버스 backing 이 정수배로 확대돼 있어서
      작은 글자도 시트의 셀 텍스트만큼 또렷하게 나온다.
   =========================================================== */

const Txt = (function () {
  const meas = document.createElement('canvas').getContext('2d');
  const wCache = new Map();
  const MAX_CACHE = 3000;

  const FAM = 'Pretendard, "맑은 고딕", "Malgun Gothic", ' +
              '"Apple SD Gothic Neo", -apple-system, sans-serif';

  /* 호출부는 예전 도트 폰트 기준(7/9/11/14)으로 크기를 넘긴다.
     화면에서는 논리 1px = 2 CSS px 로 확대되므로, 시트 셀 글자(10 CSS px)와
     같은 크기로 보이도록 논리 5px 안팎으로 매핑한다. */
  function px(size) {
    if (size <= 7) return 4;
    if (size <= 9) return 4.5;
    if (size <= 11) return 5;
    if (size <= 14) return 5.5;
    return size * 0.4;
  }

  function weight(size) {
    return size <= 11 ? 400 : 500;
  }

  function font(size) {
    return weight(size) + ' ' + px(size) + 'px ' + FAM;
  }

  /** 논리 좌표계 기준 문자열 폭 */
  function width(str, size) {
    size = size || 7;
    const key = size + '\u0001' + str;
    let w = wCache.get(key);
    if (w === undefined) {
      meas.font = font(size);
      w = Math.ceil(meas.measureText(str).width) + 2;
      if (wCache.size > MAX_CACHE) wCache.clear();
      wCache.set(key, w);
    }
    return w;
  }

  /** 글자 높이(줄 높이) — 말풍선/박스 크기 계산용 */
  function height(size) {
    return px(size || 7) + 3;
  }

  /** ctx 에 텍스트를 그린다. y 는 글자 윗줄 기준 */
  function draw(ctx, str, x, y, color, size, scale, align) {
    size = size || 7;
    scale = scale || 1;
    const p = px(size) * scale;
    ctx.save();
    ctx.font = weight(size) + ' ' + p + 'px ' + FAM;
    ctx.textBaseline = 'top';
    ctx.textAlign = (align === 'center') ? 'center' : (align === 'right') ? 'right' : 'left';
    ctx.fillStyle = color || '#1f3864';
    ctx.fillText(str, Math.round(x), Math.round(y));
    ctx.restore();
    return width(str, size) * scale;
  }

  function preload() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const jobs = [8, 9, 10, 11, 12, 16, 18, 22].map(function (p) {
      return Promise.all([
        document.fonts.load('400 ' + p + 'px Pretendard', '가나다ABC0123'),
        document.fonts.load('500 ' + p + 'px Pretendard', '가나다ABC0123'),
      ]);
    });
    return Promise.all(jobs).then(function () { wCache.clear(); })
      .catch(function () { });
  }

  return {
    draw: draw,
    width: width,
    height: height,
    preload: preload,
    clear: function () { wCache.clear(); },
  };
})();
