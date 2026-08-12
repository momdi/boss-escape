/* ===========================================================
   엑셀 위장 셸
   - 가짜 실적 시트 렌더링 (열/행 머리글, 셀 데이터)
   - 차트 개체(= 게임 캔버스) 배치
   - 보스키(`) 로 화면 완전 위장
   =========================================================== */

const Shell = (function () {
  // 셀 크기는 게임 타일 격자와 정확히 맞물리도록 런타임에 결정된다.
  // (게임 타일 16 논리px = 가로 셀 1칸, 세로 셀 2칸)
  let CW = 84;   // 열 너비 (css --cw 와 동일)
  let CH = 21;   // 행 높이 (css --ch 와 동일)

  const elGrid = document.getElementById('grid');
  const elCells = document.getElementById('cells');
  const elColHead = document.getElementById('colhead');
  const elRowHead = document.getElementById('rowhead');
  const elSel = document.getElementById('selection');
  const elChart = document.getElementById('chartobj');

  /* ---------- 결정론적 난수 ---------- */
  let seed = 20260806;
  function rnd() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }

  /* ---------- 가짜 인사 데이터 ---------- */
  const SURNAME = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남'.split('');
  const GIVEN = ['민준', '서연', '도윤', '지우', '예준', '하윤', '시우', '서윤', '주원', '지호',
    '준서', '수아', '건우', '유진', '현우', '지민', '우진', '채원', '성민', '다은',
    '태윤', '소율', '재현', '민서', '동현', '아린', '지훈', '나연', '승우', '예은'];
  const RANK = ['사원', '주임', '대리', '과장', '차장', '부장'];
  const TEAM = ['영업1팀', '영업2팀', '영업3팀', '전략기획', 'CS운영'];
  const NOTE = ['', '', '', '', '', '재제출', '', '반려 2회', '', '', '휴직', '', '파견', '', ''];

  const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const HEADER = ['사번', '성명', '직급', '소속'].concat(MONTHS, ['합계', '달성률', '비고']);

  const ROWS = [];
  (function buildRows() {
    for (let i = 0; i < 34; i++) {
      const m = [];
      let sum = 0;
      for (let k = 0; k < 12; k++) {
        const v = ri(1200, 9800) * 10;
        m.push(v);
        sum += v;
      }
      ROWS.push({
        id: 'A' + (20180000 + ri(1000, 9999)),
        name: SURNAME[ri(0, SURNAME.length - 1)] + GIVEN[ri(0, GIVEN.length - 1)],
        rank: RANK[ri(0, RANK.length - 1)],
        team: TEAM[ri(0, TEAM.length - 1)],
        m: m,
        sum: sum,
        rate: ri(52, 138),
        note: NOTE[ri(0, NOTE.length - 1)],
      });
    }
    // 사내 인물들을 슬쩍 끼워 넣는다
    ROWS[3].name = '김성태'; ROWS[3].rank = '부장'; ROWS[3].team = '영업1팀'; ROWS[3].note = '';
    ROWS[7].name = '이수민'; ROWS[7].rank = '과장'; ROWS[7].team = '영업2팀';
    ROWS[11].name = '박정호'; ROWS[11].rank = '이사'; ROWS[11].team = '전략기획'; ROWS[11].note = '';
    ROWS[16].name = '노경수'; ROWS[16].rank = '과장'; ROWS[16].team = 'CS운영'; ROWS[16].note = '연차 0일';
    ROWS[21].name = '최동혁'; ROWS[21].rank = '사원'; ROWS[21].team = '영업3팀'; ROWS[21].note = '면담 요청';
  })();

  function comma(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function colName(i) {
    let s = '';
    i += 1;
    while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = ((i - r) / 26) | 0; }
    return s;
  }

  /* ---------- 셀 그리기 ---------- */
  function cell(col, row, text, cls, span) {
    if (text === '' || text == null) return '';
    const w = CW * (span || 1);
    return '<i class="' + (cls || '') + '" style="left:' + (col * CW) + 'px;top:' + (row * CH) +
      'px;width:' + w + 'px">' + text + '</i>';
  }

  /* 시트 어딘가에 남겨 두는 제작자 표기 (실제로 눌리는 링크) */
  const CREDIT =
    '작성 · 맘디 &nbsp;|&nbsp; ' +
    '<a href="https://instagram.com/momdi.tip" target="_blank" rel="noopener">instagram.com/momdi.tip</a>' +
    ' &nbsp;·&nbsp; ' +
    '<a href="https://www.youtube.com/channel/UCZU8rI4R9CozmxZy6Ja_0AQ" target="_blank" rel="noopener">YouTube</a>' +
    ' &nbsp;·&nbsp; ' +
    '<a href="https://www.heymomdi.com" target="_blank" rel="noopener">heymomdi.com</a>';

  function renderCells(nCols, nRows) {
    const out = [];
    out.push(cell(0, 0, '2026년 영업본부 월간 실적 집계 &nbsp;(단위: 천원)', 'ttl', 5));
    out.push(cell(0, 1, '최종 수정 2026-08-06 18:42 · 김성태 부장 · 승인 대기', 'dim', 5));
    out.push(cell(0, 2, CREDIT, 'dim lnk', 7));

    for (let c = 0; c < HEADER.length && c < nCols; c++) {
      out.push(cell(c, 3, HEADER[c], 'hd ' + (c >= 4 ? 'r' : 'c')));
    }

    for (let r = 0; r < ROWS.length; r++) {
      const row = 4 + r;
      if (row >= nRows) break;
      const d = ROWS[r];
      out.push(cell(0, row, d.id, 'c dim'));
      out.push(cell(1, row, d.name, 'c'));
      out.push(cell(2, row, d.rank, 'c'));
      out.push(cell(3, row, d.team, 'c'));
      for (let k = 0; k < 12 && 4 + k < nCols; k++) out.push(cell(4 + k, row, comma(d.m[k]), 'r'));
      if (16 < nCols) out.push(cell(16, row, comma(d.sum), 'r'));
      if (17 < nCols) out.push(cell(17, row, d.rate + '.0%', 'r ' + (d.rate >= 100 ? 'ok' : d.rate < 70 ? 'neg' : '')));
      if (18 < nCols) out.push(cell(18, row, d.note, 'c dim'));
    }

    const last = Math.min(4 + ROWS.length, nRows - 1);
    out.push(cell(1, last + 1, '합계', 'hd c'));
    for (let k = 0; k < 12 && 4 + k < nCols; k++) {
      let s = 0;
      for (let r = 0; r < ROWS.length; r++) s += ROWS[r].m[k];
      out.push(cell(4 + k, last + 1, comma(s), 'hd r'));
    }
    elCells.innerHTML = out.join('');
  }

  function renderHeads(nCols, nRows) {
    const c = [];
    for (let i = 0; i < nCols; i++) c.push('<span class="' + (i === 12 ? 'on' : '') + '">' + colName(i) + '</span>');
    elColHead.innerHTML = c.join('');
    const r = [];
    for (let i = 0; i < nRows; i++) r.push('<span class="' + (i === 13 ? 'on' : '') + '">' + (i + 1) + '</span>');
    elRowHead.innerHTML = r.join('');
  }

  /* ---------- 레이아웃 ---------- */
  let cols = 0, rows = 0;

  function relayout() {
    const w = elGrid.clientWidth, h = elGrid.clientHeight;
    const nc = Math.ceil(w / CW) + 1;
    const nr = Math.ceil(h / CH) + 1;
    if (nc === cols && nr === rows) return;
    cols = nc; rows = nr;
    renderHeads(nc, nr);
    renderCells(nc, nr);
    // 선택 셀 M14
    elSel.style.left = (12 * CW - 1) + 'px';
    elSel.style.top = (13 * CH - 1) + 'px';
  }

  /** 게임 쪽 타일 배율에 맞춰 시트 셀 크기를 다시 잡는다.
   *  cw = 타일 1칸, ch = 타일 1/2칸 → 게임 격자와 시트 격자가 완전히 겹친다. */
  function setCellSize(cw, ch) {
    if (cw === CW && ch === CH) return;
    CW = cw; CH = ch;
    document.documentElement.style.setProperty('--cw', cw + 'px');
    document.documentElement.style.setProperty('--ch', ch + 'px');
    // 행 높이에 맞춰 셀 글자 크기도 같이 조절
    document.documentElement.style.setProperty('--cellfs', Math.max(8, Math.min(12, ch - 6)) + 'px');
    cols = 0; rows = 0;
    relayout();
    placeNote();
  }

  /** 게임 캔버스를 셀 격자에 정확히 스냅해서 시트의 일부처럼 얹는다 */
  function placeChart(w, h) {
    const gw = elGrid.clientWidth, gh = elGrid.clientHeight;
    let left = Math.round((gw - w) / 2 / CW) * CW;
    let top = Math.round((gh - h) / 2 / CH) * CH;
    // 사번/성명/직급/소속 열과 제목 행은 항상 보이게 둔다
    const minLeft = 4 * CW;
    if (left < minLeft) left = Math.min(minLeft, Math.max(0, Math.floor((gw - w) / CW) * CW));
    if (top < 3 * CH) top = 3 * CH;
    elChart.style.left = left + 'px';
    elChart.style.top = top + 'px';
  }

  /* ---------- 보스키 위장 ---------- */
  let camo = false;
  function setCamo(v) {
    camo = !!v;
    window.__CAMO = camo;
    document.body.classList.toggle('camo', camo);
  }

  /* ---------- 일시정지 = 완전한 엑셀 화면 ---------- */
  const elNote = document.getElementById('xlnote');
  const elName = document.getElementById('namebox');
  const elFormula = document.getElementById('formula');
  const elMode = document.getElementById('statmode');
  const elCalc = document.getElementById('statcalc');

  const NORMAL = {
    name: elName.textContent,
    formula: elFormula.textContent,
    mode: elMode.textContent,
    calc: elCalc.textContent,
  };
  // 일시정지마다 다른 수식이 뜨면 더 그럴싸하다
  const PAUSE_FORMULA = [
    '=IFERROR(퇴근시간-NOW(),"산정 불가")',
    '=COUNTIFS(근태!$C:$C,">=22:00")&"일 연속 야근"',
    '=SUMPRODUCT((상사!$B:$B="접근중")*(내자리!$D:$D))',
    '=IF(부장!$A$1="자리비움","지금이 기회","엎드려")',
    '=VLOOKUP("내 연차",인사!$A:$F,6,0)  \' 결과: 0일',
  ];
  const PAUSE_CALC = ['평균: 미정　개수: 0　합계: 0', '순환 참조: M14', '계산 중… (F9)'];
  const PAUSE_NOTE = [
    ['김성태 부장', '자리 비운 김에 M열 수식 한 번만 봐줘요.<br>어차피 오늘 퇴근 못 하잖아, 그치?'],
    ['이수민 과장', '이거 서식 왜 이래요? 내가 준 양식 있잖아요.<br>다시 받을게요. 아, 오늘 안에.'],
    ['박정호 이사', '수치는 됐고, 우리 저녁이나 먹으면서 얘기하지.<br>1차만 할 거야. 진짜로.'],
    ['노경수 과장', '나 어차피 여기서 자니까 두고 가도 돼.<br>… 반년째 그러고 있음.'],
    ['최동혁 사원', '선배 혹시 지금 나가시는 거예요?<br>어? 아니 그냥 궁금해서요.'],
  ];
  let pauseTick = 0;

  function setPause(v) {
    const on = !!v;
    document.body.classList.toggle('xlpause', on);
    if (on) {
      const n = PAUSE_NOTE[pauseTick % PAUSE_NOTE.length];
      elNote.innerHTML = '<b>' + n[0] + ':</b>' + n[1] +
        '<span class="xlnote-foot">Q 또는 Enter — 검토 계속</span>';
      elName.textContent = 'M14';
      elFormula.textContent = PAUSE_FORMULA[pauseTick % PAUSE_FORMULA.length];
      elMode.textContent = '편집';
      elCalc.textContent = PAUSE_CALC[pauseTick % PAUSE_CALC.length];
      pauseTick++;
      placeNote();
    } else {
      elName.textContent = NORMAL.name;
      elFormula.textContent = NORMAL.formula;
      elMode.textContent = NORMAL.mode;
      elCalc.textContent = NORMAL.calc;
    }
  }

  /** 메모 말풍선을 선택 셀(M14) 우측 위에 붙인다 */
  function placeNote() {
    const gw = elGrid.clientWidth;
    let left = 13 * CW + 12;
    const top = Math.max(2, 12 * CH - 8);
    if (left + 250 > gw) left = Math.max(2, gw - 250);
    elNote.style.left = left + 'px';
    elNote.style.top = top + 'px';
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Backquote') { e.preventDefault(); setCamo(!camo); }
  });
  // 창에서 눈을 떼면(다른 창 클릭 등) 자동으로 시트만 남는다
  window.addEventListener('blur', function () { setCamo(true); });

  // 클릭으로도 위장/복귀할 수 있게 — 키보드 없이도 조작 가능
  const elCamoHint = document.getElementById('camohint');
  if (elCamoHint) elCamoHint.addEventListener('click', function () { setCamo(false); });
  const elChartBtn = document.getElementById('chartbtn');
  if (elChartBtn) elChartBtn.addEventListener('click', function () { setCamo(false); });
  // 타이틀바 — / ✕ = 가짜 최소화·닫기, 실제로는 화면 위장
  document.querySelectorAll('.xl-winbtn').forEach(function (b) {
    if (b.textContent === '□') return;
    b.addEventListener('click', function () { setCamo(true); });
  });

  window.addEventListener('resize', function () { relayout(); placeNote(); });
  relayout();

  return { relayout: relayout, placeChart: placeChart, setCellSize: setCellSize, setCamo: setCamo, setPause: setPause, isCamo: function () { return camo; } };
})();

window.Shell = Shell;
