// 공종 템플릿 - 각 공종 선택 시 자동 세팅되는 기본 항목
// subSections: 하위 구역 (없으면 items 바로 사용)
// items: { name, spec, unit, materialUnit, laborUnit, expenseUnit }

export const WORK_TEMPLATES = [
  {
    id: 'gasel',
    name: '가설작업',
    subSections: [],
    items: [
      { name: '먹메김 및 보양', spec: '', unit: 'M2', materialUnit: 150, laborUnit: 1800, expenseUnit: 0 },
      { name: '폐기물처리', spec: '', unit: '식', materialUnit: 0, laborUnit: 0, expenseUnit: 400000 },
      { name: '현장정리 및 정돈', spec: '', unit: 'M2', materialUnit: 350, laborUnit: 800, expenseUnit: 0 },
      { name: '준공청소', spec: '', unit: 'M2', materialUnit: 500, laborUnit: 4000, expenseUnit: 0 },
    ],
  },
  {
    id: 'chulgeo',
    name: '철거작업',
    subSections: [],
    items: [
      { name: '폐기물', spec: '1톤 트럭', unit: '대', materialUnit: 0, laborUnit: 0, expenseUnit: 300000 },
      { name: '부자재', spec: '마대, 글라인더 날 외', unit: '식', materialUnit: 150000, laborUnit: 0, expenseUnit: 0 },
      { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 280000, expenseUnit: 20000 },
    ],
  },
  {
    id: 'seolbi',
    name: '설비작업',
    subSections: [
      {
        id: 'gongjo',
        name: '공조',
        items: [
          { name: '환풍기', spec: '힘펠 / C2-100LF / 저소음', unit: 'EA', materialUnit: 45000, laborUnit: 0, expenseUnit: 0 },
          { name: '후렉시볼덕트호스', spec: '5M', unit: 'EA', materialUnit: 8000, laborUnit: 0, expenseUnit: 0 },
          { name: '부자재', spec: '은박테잎 외', unit: '식', materialUnit: 50000, laborUnit: 0, expenseUnit: 0 },
          { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 250000, expenseUnit: 20000 },
        ],
      },
      {
        id: 'geubbaessu',
        name: '급,배수설비',
        items: [
          { name: '배수배관작업', spec: '', unit: '식', materialUnit: 450000, laborUnit: 0, expenseUnit: 0 },
          { name: '급수배관', spec: '', unit: '식', materialUnit: 50000, laborUnit: 0, expenseUnit: 0 },
        ],
      },
    ],
    items: [],
  },
  {
    id: 'mok',
    name: '목작업',
    subSections: [],
    items: [
      { name: '각재', spec: '3000*28*28', unit: 'EA', materialUnit: 39000, laborUnit: 0, expenseUnit: 0 },
      { name: '석고보드', spec: '900*1800*9.5T', unit: 'EA', materialUnit: 4300, laborUnit: 0, expenseUnit: 0 },
      { name: 'M.D.F', spec: '1220*2440*9T', unit: 'EA', materialUnit: 11000, laborUnit: 0, expenseUnit: 0 },
      { name: '합판', spec: '1220*2440*4.6T', unit: 'EA', materialUnit: 8700, laborUnit: 0, expenseUnit: 0 },
      { name: '부자재', spec: '본드 / 철물 / 실리콘 외', unit: '식', materialUnit: 300000, laborUnit: 0, expenseUnit: 0 },
      { name: '자재소운반', spec: '', unit: '식', materialUnit: 0, laborUnit: 0, expenseUnit: 200000 },
      { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 20000 },
    ],
  },
  {
    id: 'electric',
    name: '전기,통신작업',
    subSections: [],
    items: [
      { name: 'UTP', spec: 'CAT5', unit: 'M', materialUnit: 850, laborUnit: 0, expenseUnit: 0 },
      { name: '전선', spec: 'HIV 2.5SQ', unit: 'M', materialUnit: 700, laborUnit: 0, expenseUnit: 0 },
      { name: '난연CD관', spec: '16MM', unit: 'M', materialUnit: 350, laborUnit: 0, expenseUnit: 0 },
      { name: '전열기구', spec: '콘센트 / 스위치 외', unit: '식', materialUnit: 150000, laborUnit: 0, expenseUnit: 0 },
      { name: '조명기구', spec: '', unit: 'EA', materialUnit: 0, laborUnit: 0, expenseUnit: 0 },
      { name: '부자재', spec: '절연테잎 / 커넥터 외', unit: '식', materialUnit: 300000, laborUnit: 0, expenseUnit: 0 },
      { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 20000 },
    ],
  },
  {
    id: 'sobang',
    name: '소방작업',
    subSections: [],
    items: [
      { name: '전선', spec: 'HIV 1.5SQ', unit: 'M', materialUnit: 350, laborUnit: 0, expenseUnit: 0 },
      { name: '감지기', spec: '', unit: 'EA', materialUnit: 6000, laborUnit: 0, expenseUnit: 0 },
      { name: '피난유도등', spec: '', unit: 'EA', materialUnit: 22000, laborUnit: 0, expenseUnit: 0 },
      { name: 'S/P 헤드', spec: '', unit: 'EA', materialUnit: 6500, laborUnit: 0, expenseUnit: 0 },
      { name: 'S/P 조인트', spec: '3M', unit: 'EA', materialUnit: 18000, laborUnit: 0, expenseUnit: 0 },
      { name: '부자재', spec: '', unit: '식', materialUnit: 50000, laborUnit: 0, expenseUnit: 0 },
      { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 250000, expenseUnit: 20000 },
    ],
  },
  {
    id: 'sujang',
    name: '수장작업',
    subSections: [
      {
        id: 'dobae',
        name: '도배작업',
        items: [
          { name: '벽지', spec: '실크벽지', unit: 'EA', materialUnit: 35000, laborUnit: 0, expenseUnit: 0 },
          { name: '부자재', spec: '', unit: '식', materialUnit: 300000, laborUnit: 0, expenseUnit: 0 },
          { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 280000, expenseUnit: 20000 },
        ],
      },
      {
        id: 'badag',
        name: '바닥작업',
        items: [
          { name: '데코타일', spec: '450*450*3T', unit: 'BOX', materialUnit: 30000, laborUnit: 0, expenseUnit: 0 },
          { name: '본드', spec: '10KG', unit: 'EA', materialUnit: 35000, laborUnit: 0, expenseUnit: 0 },
          { name: '부자재', spec: '', unit: '식', materialUnit: 100000, laborUnit: 0, expenseUnit: 0 },
          { name: '자재소운반', spec: '', unit: '식', materialUnit: 0, laborUnit: 0, expenseUnit: 100000 },
          { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 280000, expenseUnit: 20000 },
        ],
      },
      {
        id: 'film',
        name: '필름작업',
        items: [
          { name: '인테리어필름', spec: '1000*1200', unit: 'M', materialUnit: 11000, laborUnit: 0, expenseUnit: 0 },
          { name: '부자재', spec: '프라이머, 실리콘 외', unit: '식', materialUnit: 100000, laborUnit: 0, expenseUnit: 0 },
          { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 20000 },
        ],
      },
    ],
    items: [],
  },
  {
    id: 'tile',
    name: '타일작업',
    subSections: [
      {
        id: 'tile_main',
        name: '바닥타일',
        items: [
          { name: '바닥타일', spec: '600*600 / 포쉐린타일', unit: 'BOX', materialUnit: 35000, laborUnit: 0, expenseUnit: 0 },
          { name: '압착시멘트', spec: '20KG', unit: 'EA', materialUnit: 5800, laborUnit: 0, expenseUnit: 0 },
          { name: '백시멘트', spec: '20KG', unit: 'EA', materialUnit: 6000, laborUnit: 0, expenseUnit: 0 },
          { name: '부자재', spec: '평판클립 / 줄눈간격제 외', unit: '식', materialUnit: 200000, laborUnit: 0, expenseUnit: 0 },
          { name: '자재소운반', spec: '', unit: '식', materialUnit: 0, laborUnit: 0, expenseUnit: 200000 },
          { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 20000 },
        ],
      },
      {
        id: 'tile_wall',
        name: '벽타일',
        items: [
          { name: '벽타일', spec: '300*600', unit: 'BOX', materialUnit: 25000, laborUnit: 0, expenseUnit: 0 },
          { name: '세라픽스', spec: '17KG', unit: 'EA', materialUnit: 17500, laborUnit: 0, expenseUnit: 0 },
          { name: '부자재', spec: '코너비드 외', unit: '식', materialUnit: 30000, laborUnit: 0, expenseUnit: 0 },
          { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 20000 },
        ],
      },
    ],
    items: [],
  },
  {
    id: 'changho',
    name: '창호작업',
    subSections: [],
    items: [
      { name: '픽스유리', spec: '투명강화', unit: 'EA', materialUnit: 0, laborUnit: 0, expenseUnit: 0 },
      { name: '부자재', spec: '', unit: '식', materialUnit: 100000, laborUnit: 0, expenseUnit: 0 },
      { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 0 },
    ],
  },
  {
    id: 'dojang',
    name: '도장작업',
    subSections: [],
    items: [
      { name: '퍼티', spec: '', unit: 'EA', materialUnit: 32000, laborUnit: 0, expenseUnit: 0 },
      { name: '워스볼', spec: '', unit: 'EA', materialUnit: 45000, laborUnit: 0, expenseUnit: 0 },
      { name: '페인트', spec: '수성페인트', unit: 'EA', materialUnit: 120000, laborUnit: 0, expenseUnit: 0 },
      { name: '부자재', spec: '', unit: '식', materialUnit: 300000, laborUnit: 0, expenseUnit: 0 },
      { name: '노무비', spec: '', unit: '인', materialUnit: 0, laborUnit: 300000, expenseUnit: 20000 },
    ],
  },
  {
    id: 'gagu',
    name: '가구',
    subSections: [],
    items: [
      { name: '가구', spec: '', unit: 'EA', materialUnit: 0, laborUnit: 0, expenseUnit: 0 },
    ],
  },
  {
    id: 'gita',
    name: '기타',
    subSections: [],
    items: [
      { name: '기타', spec: '', unit: '식', materialUnit: 0, laborUnit: 0, expenseUnit: 0 },
    ],
  },
];
