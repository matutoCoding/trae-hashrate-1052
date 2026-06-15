export interface CapFeatures {
  shape: string;
  color: string;
  diameter: number;
  hasScales: boolean;
  scaleColor?: string;
}

export interface GillFeatures {
  color: string;
  density: 'crowded' | 'close' | 'distant' | '';
  attachment: string;
}

export interface StemFeatures {
  color: string;
  length: number;
  thickness: number;
  texture: string;
  hasVolva: boolean;
  volvaShape?: string;
  volvaColor?: string;
}

export interface RingFeatures {
  present: boolean;
  position?: 'upper' | 'middle' | 'lower' | '';
  shape?: string;
  color?: string;
}

export interface MorphologyFeatures {
  cap: CapFeatures;
  gill: GillFeatures;
  stem: StemFeatures;
  ring: RingFeatures;
  sporePrint: string;
  developmentStage: 'young' | 'mature' | 'old' | '';
  deformed: boolean;
}

export interface HabitatData {
  gps: { lat: number; lng: number; accuracy: number };
  altitude: number;
  trees: string[];
  season: string;
  collectedAt: string;
  photos: string[];
  notes: string;
}

export interface Species {
  id: number;
  chineseName: string;
  latinName: string;
  commonName: string;
  isAmanita: boolean;
  cap: {
    shapes: string[];
    colors: string[];
    diameterRange: [number, number];
    scales: boolean;
  };
  gill: {
    colors: string[];
    densities: string[];
    attachments: string[];
  };
  stem: {
    colors: string[];
    lengthRange: [number, number];
    thicknessRange: [number, number];
    textures: string[];
  };
  ring: {
    present: boolean;
    positions: string[];
    shapes: string[];
    colors: string[];
  };
  volva: {
    present: boolean;
    shapes: string[];
    colors: string[];
  };
  sporePrintColors: string[];
  habitat: {
    trees: string[];
    altitudeRange: [number, number];
    seasons: string[];
  };
  toxicity: {
    level: 0 | 1 | 2 | 3 | 4;
    types: string[];
    heatStable: boolean;
  };
  safetyLevel: 1 | 2 | 3 | 4 | 5;
  keyIdentifiers: string[];
  lookalikeDangers: { speciesId: number; difference: string }[];
  edibility: {
    edible: boolean;
    advice: string;
    blanchMinutes?: number;
  };
  imageUrl: string;
  gallery?: boolean;
}

export interface MatchCandidate {
  speciesId: number;
  matchScore: number;
  matchedFeatures: string[];
  differingFeatures: { feature: string; input: string; expected: string }[];
  habitatPenalty: number;
  weightedBreakdown: Record<string, number>;
}

export interface RiskAssessment {
  amanitaMatch: boolean;
  amanitaHits: string[];
  toxicityRisk: number;
  misjudgmentWindow: boolean;
  misjudgmentReason?: string;
  cooccurrenceProb: number;
  cooccurringSpecies: { id: number; name: string; prob: number }[];
  detoxPossible: boolean;
  detoxFailureReason?: string;
  heatStableToxins: string[];
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  recommendDiscard: boolean;
}

export interface CollectionRecord {
  id: string;
  collectedAt: string;
  habitat: HabitatData;
  morphology: MorphologyFeatures;
  matching: { candidates: MatchCandidate[]; topMatchId?: number };
  risk: RiskAssessment;
  finalDecision: 'discarded' | 'pending' | 'edible';
  decisionNotes?: string;
  addedToGallery?: boolean;
}

export interface PersonalGalleryEntry {
  id: string;
  speciesId: number;
  speciesName: string;
  recordId: string;
  collectedAt: string;
  location: { lat: number; lng: number; altitude: number };
  locationLabel?: string;
  photo?: string;
  notes?: string;
  confidence: number;
  addedAt: string;
}

export type PageRoute = '/' | '/match' | '/risk' | '/archive' | '/gallery' | '/archive/:id';
