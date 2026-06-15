import type { MorphologyFeatures, HabitatData, RiskAssessment, MatchCandidate, CollectionRecord } from '../types';
import { SPECIES_DATABASE } from '../data/speciesDatabase';

const AMANITA_TRIPLE = ['gillColor', 'ringPresent', 'volvaPresent'];

export function analyzeRisk(
  morphology: MorphologyFeatures,
  candidates: MatchCandidate[],
  habitat?: Partial<HabitatData>,
  existingRecords: CollectionRecord[] = []
): RiskAssessment {
  const amanitaHits: string[] = [];
  const tripleThreshold = 0.75;

  if (morphology.gill.color) {
    const gillFamily = findColorFamilyLite(morphology.gill.color);
    if (gillFamily === 'white') amanitaHits.push(`菌褶${morphology.gill.color}（属白色系）`);
  }
  if (morphology.ring.present) amanitaHits.push('有菌环');
  if (morphology.stem.hasVolva) amanitaHits.push('有菌托');

  const isAmanitaMatch = amanitaHits.length >= 2;

  let toxicityRisk = 0;
  let heatStableToxins: string[] = [];

  for (const cand of candidates.slice(0, 5)) {
    const sp = SPECIES_DATABASE.find(s => s.id === cand.speciesId);
    if (!sp) continue;
    const contribution = (cand.matchScore / 100) * (sp.toxicity.level / 4) * 100;
    toxicityRisk = Math.max(toxicityRisk, contribution);
    if (sp.toxicity.heatStable && cand.matchScore > tripleThreshold * 100) {
      heatStableToxins.push(...sp.toxicity.types);
    }
  }
  heatStableToxins = Array.from(new Set(heatStableToxins));

  let misjudgmentWindow = false;
  let misjudgmentReason: string | undefined;

  if (morphology.developmentStage === 'young') {
    misjudgmentWindow = true;
    misjudgmentReason = '幼菇期——菌盖未展开，菌环菌托特征不明显，白色菌褶尚未分化，极易与鹅膏属幼体混淆。建议观察成熟个体后再判定。';
  } else if (morphology.developmentStage === 'old' || morphology.deformed) {
    misjudgmentWindow = true;
    const reasons = [];
    if (morphology.developmentStage === 'old') reasons.push('老熟期——菌盖变形、菌褶液化褪色、菌环菌托脱落，特征丢失易误判。');
    if (morphology.deformed) reasons.push('样本形态异常——可能为虫蛀、机械损伤或畸形，特征不可靠。');
    misjudgmentReason = reasons.join(' ');
  }

  let cooccurrenceProb = 0;
  const cooccurringSpecies: { id: number; name: string; prob: number }[] = [];

  if (habitat?.gps && existingRecords.length > 0) {
    const { lat, lng } = habitat.gps;
    const RADIUS_M = 50;
    const DAYS = 30;
    const now = new Date();

    const nearby = existingRecords.filter(r => {
      const rLat = r.habitat?.gps?.lat;
      const rLng = r.habitat?.gps?.lng;
      if (rLat == null || rLng == null) return false;
      const dist = haversineMeters(lat, lng, rLat, rLng);
      const daysDiff = (now.getTime() - new Date(r.collectedAt).getTime()) / 86400000;
      return dist <= RADIUS_M && daysDiff <= DAYS;
    });

    if (nearby.length > 0) {
      const topCandidateIds = candidates.slice(0, 3).map(c => c.speciesId);
      for (const r of nearby) {
        for (const cand of r.matching.candidates.slice(0, 3)) {
          if (topCandidateIds.includes(cand.speciesId)) continue;
          const sp = SPECIES_DATABASE.find(s => s.id === cand.speciesId);
          if (!sp) continue;
          const existing = cooccurringSpecies.find(c => c.id === sp.id);
          if (existing) existing.prob += 15;
          else cooccurringSpecies.push({ id: sp.id, name: sp.chineseName, prob: 30 });
        }
      }
      if (cooccurringSpecies.length > 0) {
        cooccurrenceProb = Math.min(95, cooccurringSpecies.reduce((acc, c) => acc + c.prob, 0));
      }
    }
  }

  // 生境重叠天然混生概率
  if (habitat?.trees?.length) {
    for (const cand of candidates.slice(0, 3)) {
      const sp = SPECIES_DATABASE.find(s => s.id === cand.speciesId);
      if (!sp) continue;
      for (const other of SPECIES_DATABASE) {
        if (other.id === sp.id) continue;
        if (cooccurringSpecies.some(c => c.id === other.id)) continue;
        const sharedTrees = habitat.trees.filter(t => other.habitat.trees.includes(t));
        if (sharedTrees.length >= 2 && cand.matchScore > 50) {
          const prob = Math.min(30, sharedTrees.length * 10);
          cooccurringSpecies.push({ id: other.id, name: other.chineseName, prob });
          cooccurrenceProb = Math.min(90, cooccurrenceProb + prob);
        }
      }
    }
  }

  let detoxPossible = true;
  let detoxFailureReason: string | undefined;

  if (heatStableToxins.length > 0) {
    detoxPossible = false;
    detoxFailureReason = `检出热稳定毒素：${heatStableToxins.join('、')}。此类毒素100℃煮沸、高压锅、油炸均无法完全破坏，蒸煮焯水无效！`;
  } else if (isAmanitaMatch) {
    const amanitaCandidate = candidates.find(c => {
      const sp = SPECIES_DATABASE.find(s => s.id === c.speciesId);
      return sp?.isAmanita && c.matchScore > 60;
    });
    if (amanitaCandidate) {
      detoxPossible = false;
      detoxFailureReason = '高相似度匹配鹅膏属剧毒种。鹅膏毒肽分子量极小，热稳定性极强，任何烹饪方式均无法解毒。';
    }
  }

  let overallRisk: RiskAssessment['overallRisk'] = 'low';
  let recommendDiscard = false;

  const topToxic = candidates.find(c => {
    const sp = SPECIES_DATABASE.find(s => s.id === c.speciesId);
    return sp && sp.toxicity.level >= 3 && c.matchScore > 50;
  });

  if (isAmanitaMatch && (amanitaHits.length >= 3 || topToxic?.matchScore && topToxic.matchScore > 60)) {
    overallRisk = 'extreme';
    recommendDiscard = true;
  } else if (topToxic || toxicityRisk > 60) {
    overallRisk = 'high';
    recommendDiscard = true;
  } else if (misjudgmentWindow || cooccurrenceProb > 40 || !detoxPossible) {
    overallRisk = 'medium';
    if (!detoxPossible) recommendDiscard = true;
  }

  return {
    amanitaMatch: isAmanitaMatch,
    amanitaHits,
    toxicityRisk: Math.round(toxicityRisk),
    misjudgmentWindow,
    misjudgmentReason,
    cooccurrenceProb: Math.round(cooccurrenceProb),
    cooccurringSpecies: cooccurringSpecies.sort((a, b) => b.prob - a.prob).slice(0, 5),
    detoxPossible,
    detoxFailureReason,
    heatStableToxins,
    overallRisk,
    recommendDiscard,
  };
}

function findColorFamilyLite(color: string): string | null {
  const whites = ['白色', '乳白色', '污白色', '黄白色', '近白色', '米白色'];
  if (whites.includes(color)) return 'white';
  const yellows = ['金黄色', '鲜黄色', '橙黄色', '淡黄色'];
  if (yellows.includes(color)) return 'yellow';
  return null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
