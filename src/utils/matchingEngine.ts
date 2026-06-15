import type { MorphologyFeatures, HabitatData, Species, MatchCandidate } from '../types';
import { SPECIES_DATABASE } from '../data/speciesDatabase';

const COLOR_FAMILIES: Record<string, string[]> = {
  white: ['白色', '乳白色', '污白色', '黄白色', '近白色', '米白色', '白色（菌孔）'],
  pink: ['粉红色', '浅红色', '肉粉色', '淡粉色', '淡紫色'],
  yellow: ['鲜黄色', '金黄色', '橙黄色', '黄白色', '淡黄色', '乳黄色'],
  orange: ['橘红色', '橙红色', '橘黄色', '橙黄'],
  red: ['鲜红色', '珊瑚红色', '血红色'],
  brown: [
    '淡褐色', '浅褐色', '黄褐色', '灰褐色', '棕褐色', '深褐色', '黑褐色',
    '鼠灰色', '黑灰色', '近黑色', '栗褐色', '肉桂色', '土黄色', '浅棕色',
    '浅土黄色', '暗褐色', '红褐色',
  ],
  green: ['绿色', '青绿色', '草绿色', '深绿'],
};

const FEATURE_WEIGHTS = {
  capShape: 0.05,
  capColor: 0.05,
  capDiameter: 0.03,
  capScales: 0.02,
  gillColor: 0.12,
  gillDensity: 0.04,
  gillAttachment: 0.04,
  stemColor: 0.05,
  stemLength: 0.04,
  stemThickness: 0.03,
  stemTexture: 0.03,
  ringPresent: 0.12,
  ringPosition: 0.04,
  ringShape: 0.02,
  ringColor: 0.02,
  volvaPresent: 0.12,
  volvaShape: 0.04,
  volvaColor: 0.04,
  sporePrint: 0.10,
};

function findColorFamily(color: string): string | null {
  for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
    if (colors.includes(color)) return family;
  }
  return null;
}

function matchColor(input: string, expected: string[]): number {
  if (!input) return 0;
  if (expected.includes(input)) return 1;
  const inputFamily = findColorFamily(input);
  if (!inputFamily) return 0;
  for (const e of expected) {
    if (findColorFamily(e) === inputFamily) return 0.7;
  }
  return 0;
}

function matchRange(input: number, range: [number, number], tolerance = 0.3): number {
  if (!input || input <= 0) return 0.5;
  const [min, max] = range;
  const mid = (min + max) / 2;
  const half = (max - min) / 2;
  const tolMin = min * (1 - tolerance);
  const tolMax = max * (1 + tolerance);
  if (input >= min && input <= max) return 1;
  if (input < tolMin || input > tolMax) return 0;
  const dist = input < min ? min - input : input - max;
  const tolRange = input < min ? min - tolMin : tolMax - max;
  return 1 - dist / tolRange;
}

function matchString(input: string, expected: string[]): number {
  if (!input || expected.length === 0) return 0.5;
  if (expected.includes(input)) return 1;
  const inputWords = input.split(/[·、（）()]/);
  for (const e of expected) {
    for (const w of inputWords) {
      if (e.includes(w) && w.length >= 2) return 0.6;
    }
  }
  return 0;
}

function matchBoolean(input: boolean, expected: boolean): number {
  if (input === expected) return 1;
  return expected ? 0.05 : 0.7;
}

export function matchAllSpecies(
  morphology: MorphologyFeatures,
  habitat?: Partial<HabitatData>
): MatchCandidate[] {
  const results: MatchCandidate[] = [];

  for (const species of SPECIES_DATABASE) {
    let totalScore = 0;
    const matchedFeatures: string[] = [];
    const differingFeatures: MatchCandidate['differingFeatures'] = [];
    const breakdown: Record<string, number> = {};

    const score = (featureKey: string, label: string, s: number, inputVal: string, expectedStr: string) => {
      breakdown[featureKey] = Math.round(s * 100);
      totalScore += s * FEATURE_WEIGHTS[featureKey as keyof typeof FEATURE_WEIGHTS];
      if (s >= 0.8) matchedFeatures.push(label);
      else if (s < 0.5) differingFeatures.push({ feature: label, input: inputVal || '未填', expected: expectedStr });
    };

    const s1 = matchString(morphology.cap.shape, species.cap.shapes);
    score('capShape', '菌盖形状', s1, morphology.cap.shape, species.cap.shapes.join('/'));

    const s2 = matchColor(morphology.cap.color, species.cap.colors);
    score('capColor', '菌盖颜色', s2, morphology.cap.color, species.cap.colors.join('/'));

    const s3 = matchRange(morphology.cap.diameter, species.cap.diameterRange);
    score('capDiameter', '菌盖直径', s3, `${morphology.cap.diameter}cm`, `${species.cap.diameterRange[0]}-${species.cap.diameterRange[1]}cm`);

    const s4 = matchBoolean(morphology.cap.hasScales, species.cap.scales);
    score('capScales', '菌盖鳞片', s4, morphology.cap.hasScales ? '有' : '无', species.cap.scales ? '有' : '无');

    const s5 = matchColor(morphology.gill.color, species.gill.colors);
    score('gillColor', '菌褶颜色', s5, morphology.gill.color, species.gill.colors.join('/'));

    const s6 = matchString(morphology.gill.density, species.gill.densities);
    score('gillDensity', '菌褶密度', s6, morphology.gill.density, species.gill.densities.join('/'));

    const s7 = matchString(morphology.gill.attachment, species.gill.attachments);
    score('gillAttachment', '菌褶附着', s7, morphology.gill.attachment, species.gill.attachments.join('/'));

    const s8 = matchColor(morphology.stem.color, species.stem.colors);
    score('stemColor', '菌柄颜色', s8, morphology.stem.color, species.stem.colors.join('/'));

    const s9 = matchRange(morphology.stem.length, species.stem.lengthRange);
    score('stemLength', '菌柄长度', s9, `${morphology.stem.length}cm`, `${species.stem.lengthRange[0]}-${species.stem.lengthRange[1]}cm`);

    const s10 = matchRange(morphology.stem.thickness, species.stem.thicknessRange);
    score('stemThickness', '菌柄粗度', s10, `${morphology.stem.thickness}cm`, `${species.stem.thicknessRange[0]}-${species.stem.thicknessRange[1]}cm`);

    const s11 = matchString(morphology.stem.texture, species.stem.textures);
    score('stemTexture', '菌柄质地', s11, morphology.stem.texture, species.stem.textures.join('/'));

    const s12 = matchBoolean(morphology.ring.present, species.ring.present);
    score('ringPresent', '有无菌环', s12, morphology.ring.present ? '有' : '无', species.ring.present ? '有' : '无');

    const s13 = species.ring.present && morphology.ring.present
      ? matchString(morphology.ring.position || '', species.ring.positions)
      : 0.5;
    score('ringPosition', '菌环位置', s13, morphology.ring.position || '', species.ring.positions.join('/'));

    const s14 = species.ring.present && morphology.ring.present
      ? matchString(morphology.ring.shape || '', species.ring.shapes)
      : 0.5;
    score('ringShape', '菌环形态', s14, morphology.ring.shape || '', species.ring.shapes.join('/'));

    const s15 = species.ring.present && morphology.ring.present
      ? matchColor(morphology.ring.color || '', species.ring.colors)
      : 0.5;
    score('ringColor', '菌环颜色', s15, morphology.ring.color || '', species.ring.colors.join('/'));

    const s16 = matchBoolean(morphology.stem.hasVolva, species.volva.present);
    score('volvaPresent', '有无菌托', s16, morphology.stem.hasVolva ? '有' : '无', species.volva.present ? '有' : '无');

    const s17 = species.volva.present && morphology.stem.hasVolva
      ? matchString(morphology.stem.volvaShape || '', species.volva.shapes)
      : 0.5;
    score('volvaShape', '菌托形态', s17, morphology.stem.volvaShape || '', species.volva.shapes.join('/'));

    const s18 = species.volva.present && morphology.stem.hasVolva
      ? matchColor(morphology.stem.volvaColor || '', species.volva.colors)
      : 0.5;
    score('volvaColor', '菌托颜色', s18, morphology.stem.volvaColor || '', species.volva.colors.join('/'));

    const s19 = matchColor(morphology.sporePrint, species.sporePrintColors);
    score('sporePrint', '孢印颜色', s19, morphology.sporePrint, species.sporePrintColors.join('/'));

    let habitatPenalty = 0;
    if (habitat) {
      if (habitat.trees?.length && species.habitat.trees.length) {
        const common = habitat.trees.filter(t => species.habitat.trees.includes(t));
        if (common.length === 0) habitatPenalty += 15;
      }
      if (habitat.altitude && habitat.altitude > 0) {
        const [min, max] = species.habitat.altitudeRange;
        if (habitat.altitude < min * 0.5 || habitat.altitude > max * 2) habitatPenalty += 10;
      }
      if (habitat.season && species.habitat.seasons.length) {
        if (!species.habitat.seasons.includes(habitat.season)) habitatPenalty += 15;
      }
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore * 100) - habitatPenalty));

    results.push({
      speciesId: species.id,
      matchScore: finalScore,
      matchedFeatures,
      differingFeatures,
      habitatPenalty,
      weightedBreakdown: breakdown,
    });
  }

  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}

export function getSpeciesById(id: number): Species | undefined {
  return SPECIES_DATABASE.find(s => s.id === id);
}
