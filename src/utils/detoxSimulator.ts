export interface ToxinInfo {
  name: string;
  chineseName: string;
  heatStable: boolean;
  ld50MgKg: number;
  targetOrgan: string;
  onsetHours: [number, number];
  mortality: string;
  blanchBreakdown: number;
  boil10Breakdown: number;
  pressureCookBreakdown: number;
  fryBreakdown: number;
  notes: string;
}

export const TOXIN_DATABASE: ToxinInfo[] = [
  {
    name: 'α-amanitin',
    chineseName: '鹅膏毒肽（α-鹅膏蕈碱）',
    heatStable: true,
    ld50MgKg: 0.1,
    targetOrgan: '肝、肾',
    onsetHours: [6, 24],
    mortality: '>90%（未治疗）',
    blanchBreakdown: 0,
    boil10Breakdown: 0,
    pressureCookBreakdown: 0,
    fryBreakdown: 0,
    notes: '双环八肽，分子量918Da，分子内有硫桥结构。100℃煮100小时、高压锅121℃加压、油炸碳化均无法破坏。是已知最耐热的天然毒素之一。',
  },
  {
    name: 'Phalloidin',
    chineseName: '鬼笔毒肽',
    heatStable: true,
    ld50MgKg: 2.0,
    targetOrgan: '肝',
    onsetHours: [1, 6],
    mortality: '辅助致死',
    blanchBreakdown: 0,
    boil10Breakdown: 0,
    pressureCookBreakdown: 0,
    fryBreakdown: 0,
    notes: '双环七肽。虽然单独毒性低于鹅膏毒肽，但同样极耐热，协同增强肝损伤。',
  },
  {
    name: 'Gyromitrin',
    chineseName: '鹿花菌素（甲基联氨）',
    heatStable: false,
    ld50MgKg: 10,
    targetOrgan: '肝、神经',
    onsetHours: [2, 12],
    mortality: '15-30%',
    blanchBreakdown: 60,
    boil10Breakdown: 85,
    pressureCookBreakdown: 90,
    fryBreakdown: 80,
    notes: '可被沸水部分溶解和降解，但有残留风险。代谢产物甲基联氨为致癌物，即使未出现急性中毒也不建议反复食用。',
  },
  {
    name: 'Muscarine',
    chineseName: '毒蝇碱',
    heatStable: false,
    ld50MgKg: 45,
    targetOrgan: '副交感神经',
    onsetHours: [0.5, 2],
    mortality: '<1%',
    blanchBreakdown: 70,
    boil10Breakdown: 90,
    pressureCookBreakdown: 95,
    fryBreakdown: 85,
    notes: '季铵生物碱，可溶于水且部分热解。煮沸15分钟并换水可去除大部分，但仍有残留风险。',
  },
  {
    name: 'Ibotenic acid',
    chineseName: '鹅膏蕈氨酸',
    heatStable: false,
    ld50MgKg: 50,
    targetOrgan: '中枢神经',
    onsetHours: [0.5, 1.5],
    mortality: '<0.1%',
    blanchBreakdown: 55,
    boil10Breakdown: 80,
    pressureCookBreakdown: 90,
    fryBreakdown: 75,
    notes: '谷氨酸类似物，具有神经兴奋作用。加热可脱羧转化为蝇蕈醇，仍具有精神活性。',
  },
  {
    name: 'Muscimol',
    chineseName: '蝇蕈醇',
    heatStable: false,
    ld50MgKg: 30,
    targetOrgan: '中枢神经',
    onsetHours: [0.5, 1.5],
    mortality: '<0.1%',
    blanchBreakdown: 60,
    boil10Breakdown: 85,
    pressureCookBreakdown: 90,
    fryBreakdown: 80,
    notes: 'GABA-A受体激动剂，致幻作用。是鹅膏蕈氨酸加热脱羧产物，反复换水煮沸可降低含量。',
  },
  {
    name: 'Russulapeptides',
    chineseName: '红菇素（胃肠刺激物）',
    heatStable: false,
    ld50MgKg: 200,
    targetOrgan: '胃肠道',
    onsetHours: [0.5, 3],
    mortality: '极低',
    blanchBreakdown: 70,
    boil10Breakdown: 95,
    pressureCookBreakdown: 98,
    fryBreakdown: 95,
    notes: '蛋白类胃肠道刺激物，充分煮熟后可灭活。但剧烈呕吐腹泻仍需警惕脱水风险。',
  },
  {
    name: 'Volvatoxin',
    chineseName: '草菇毒蛋白',
    heatStable: false,
    ld50MgKg: 2.5,
    targetOrgan: '心肌、肝',
    onsetHours: [8, 24],
    mortality: '低（充分煮熟）',
    blanchBreakdown: 90,
    boil10Breakdown: 99,
    pressureCookBreakdown: 100,
    fryBreakdown: 99,
    notes: '鲜草菇中含有的不稳定毒蛋白。100℃煮10分钟以上即可完全灭活，这就是草菇必须彻底煮熟的原因！',
  },
];

export interface DetoxSimulationResult {
  canDetoxify: boolean;
  overallBreakdown: number;
  methods: {
    method: string;
    label: string;
    totalBreakdown: number;
    residualRisk: 'none' | 'low' | 'medium' | 'high' | 'extreme';
    remainingToxins: { name: string; chineseName: string; residualPercent: number }[];
    recommendation: string;
  }[];
  dangerousToxins: string[];
  finalVerdict: 'safe' | 'caution' | 'danger' | 'never';
  explanation: string;
}

export function simulateDetoxification(
  toxinTypes: string[],
  isAmanitaHighRisk: boolean
): DetoxSimulationResult {
  const matched = TOXIN_DATABASE.filter(t =>
    toxinTypes.some(tt => t.chineseName.includes(tt) || tt.includes(t.name) || tt.includes(t.chineseName.slice(0, 4)))
  );

  const hasHeatStable = matched.some(t => t.heatStable) || isAmanitaHighRisk;
  const dangerousToxins = matched.filter(t => t.heatStable).map(t => t.chineseName);
  if (isAmanitaHighRisk && !dangerousToxins.includes('鹅膏毒肽（α-鹅膏蕈碱）')) {
    dangerousToxins.push('鹅膏毒肽（α-鹅膏蕈碱）');
  }

  const detoxMethods = [
    { key: 'blanch', label: '焯水10分钟+换水', blanch: 1, boil: 0, pressure: 0, fry: 0 },
    { key: 'boil', label: '煮沸10分钟', blanch: 0, boil: 1, pressure: 0, fry: 0 },
    { key: 'pressure', label: '高压锅15分钟', blanch: 0, boil: 0, pressure: 1, fry: 0 },
    { key: 'fry', label: '高温油炸3分钟', blanch: 0, boil: 0, pressure: 0, fry: 1 },
  ];

  const workingToxins = matched.length ? matched : (
    isAmanitaHighRisk
      ? [TOXIN_DATABASE[0], TOXIN_DATABASE[1]]
      : toxinTypes.length ? [] : []
  );

  const methods = detoxMethods.map(m => {
    const breakdowns = workingToxins.map(t => {
      const pct = t.blanchBreakdown * m.blanch + t.boil10Breakdown * m.boil +
        t.pressureCookBreakdown * m.pressure + t.fryBreakdown * m.fry;
      return { toxin: t, pct: Math.min(100, pct) };
    });

    const avgBreakdown = breakdowns.length
      ? breakdowns.reduce((acc, b) => acc + b.pct, 0) / breakdowns.length
      : 100;

    const residualToxins = breakdowns
      .filter(b => b.pct < 100)
      .map(b => ({ name: b.toxin.name, chineseName: b.toxin.chineseName, residualPercent: Math.round(100 - b.pct) }));

    let residualRisk: DetoxSimulationResult['methods'][0]['residualRisk'] = 'none';
    let recommendation = '可完全解毒，建议采用';

    if (hasHeatStable) {
      residualRisk = 'extreme';
      recommendation = '❌ 含热稳定毒素，任何烹饪方式均无法完全解毒，绝对不可食！';
    } else if (avgBreakdown < 80) {
      residualRisk = 'high';
      recommendation = '毒素残留量高，强烈建议弃采';
    } else if (avgBreakdown < 95) {
      residualRisk = 'medium';
      recommendation = '仍有少量残留，需经验者判断，新手建议弃采';
    } else if (avgBreakdown < 100) {
      residualRisk = 'low';
      recommendation = '基本完全解毒，可常规食用';
    }

    return {
      method: m.key,
      label: m.label,
      totalBreakdown: Math.round(avgBreakdown),
      residualRisk,
      remainingToxins: residualToxins,
      recommendation,
    };
  });

  const overallBreakdown = methods.length ? methods.reduce((acc, m) => Math.max(acc, m.totalBreakdown), 0) : 100;
  const canDetoxify = !hasHeatStable && overallBreakdown >= 95;

  let finalVerdict: DetoxSimulationResult['finalVerdict'] = 'safe';
  let explanation = '所有毒素均可通过常规烹饪完全灭活。';

  if (hasHeatStable) {
    finalVerdict = 'never';
    explanation = '⚠️ 检出极耐热毒素！任何蒸煮焯水、高压锅、油炸手段均无法破坏。采食此菌等同服毒，死亡率>90%，立即弃采！';
  } else if (overallBreakdown < 80) {
    finalVerdict = 'danger';
    explanation = '部分毒素热稳定性强，常规烹饪仍有高残留。宁可错杀不可放过，建议弃采。';
  } else if (overallBreakdown < 95) {
    finalVerdict = 'caution';
    explanation = '需严格按推荐方式充分烹饪，经验不足者建议弃采。';
  }

  return {
    canDetoxify,
    overallBreakdown,
    methods,
    dangerousToxins,
    finalVerdict,
    explanation,
  };
}
