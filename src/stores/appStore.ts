import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MorphologyFeatures, HabitatData, MatchCandidate, RiskAssessment, CollectionRecord, PersonalGalleryEntry } from '../types';

export const emptyMorphology = (): MorphologyFeatures => ({
  cap: { shape: '', color: '', diameter: 0, hasScales: false },
  gill: { color: '', density: '', attachment: '' },
  stem: { color: '', length: 0, thickness: 0, texture: '', hasVolva: false },
  ring: { present: false },
  sporePrint: '',
  developmentStage: '',
  deformed: false,
});

export const emptyHabitat = (): HabitatData => ({
  gps: { lat: 0, lng: 0, accuracy: 0 },
  altitude: 0,
  trees: [],
  season: '',
  collectedAt: new Date().toISOString(),
  photos: [],
  notes: '',
});

interface AppState {
  morphology: MorphologyFeatures;
  habitat: Partial<HabitatData>;
  candidates: MatchCandidate[];
  risk: RiskAssessment | null;
  records: CollectionRecord[];
  gallerySpeciesIds: number[];
  personalGallery: PersonalGalleryEntry[];
  offline: boolean;

  setMorphology: (fn: (prev: MorphologyFeatures) => MorphologyFeatures) => void;
  resetMorphology: () => void;
  setHabitat: (fn: (prev: Partial<HabitatData>) => Partial<HabitatData>) => void;
  resetHabitat: () => void;
  setCandidates: (c: MatchCandidate[]) => void;
  setRisk: (r: RiskAssessment | null) => void;
  addRecord: (r: CollectionRecord) => void;
  removeRecord: (id: string) => void;
  addToGallery: (speciesId: number) => void;
  removeFromGallery: (speciesId: number) => void;
  addPersonalGalleryEntry: (entry: PersonalGalleryEntry) => void;
  removePersonalGalleryEntry: (id: string) => void;
  setOffline: (v: boolean) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      morphology: emptyMorphology(),
      habitat: emptyHabitat(),
      candidates: [],
      risk: null,
      records: [],
      gallerySpeciesIds: [5, 6, 7, 8, 9, 10, 12, 14],
      personalGallery: [],
      offline: true,

      setMorphology: (fn) => set((s) => ({ morphology: fn(s.morphology) })),
      resetMorphology: () => set({ morphology: emptyMorphology() }),
      setHabitat: (fn) => set((s) => ({ habitat: fn(s.habitat) })),
      resetHabitat: () => set({ habitat: emptyHabitat() }),
      setCandidates: (c) => set({ candidates: c }),
      setRisk: (r) => set({ risk: r }),
      addRecord: (r) => set((s) => ({ records: [r, ...s.records] })),
      removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      addToGallery: (speciesId) =>
        set((s) => ({
          gallerySpeciesIds: s.gallerySpeciesIds.includes(speciesId)
            ? s.gallerySpeciesIds
            : [...s.gallerySpeciesIds, speciesId],
        })),
      removeFromGallery: (speciesId) =>
        set((s) => ({ gallerySpeciesIds: s.gallerySpeciesIds.filter((i) => i !== speciesId) })),
      addPersonalGalleryEntry: (entry) =>
        set((s) => ({ personalGallery: [entry, ...s.personalGallery] })),
      removePersonalGalleryEntry: (id) =>
        set((s) => ({ personalGallery: s.personalGallery.filter((e) => e.id !== id) })),
      setOffline: (v) => set({ offline: v }),
      resetAll: () => set({ morphology: emptyMorphology(), habitat: emptyHabitat(), candidates: [], risk: null }),
    }),
    {
      name: 'mushroom-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        records: s.records,
        gallerySpeciesIds: s.gallerySpeciesIds,
        personalGallery: s.personalGallery,
      }),
    }
  )
);
