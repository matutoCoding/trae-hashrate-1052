import Dexie, { type Table } from 'dexie';
import type { CollectionRecord, Species } from '../types';

class MushroomDatabase extends Dexie {
  records!: Table<CollectionRecord, string>;
  species!: Table<Species, number>;
  gallery!: Table<{ speciesId: number; addedAt: string; count: number }, number>;

  constructor() {
    super('MushroomSurveyDB');
    this.version(1).stores({
      records: 'id, collectedAt, finalDecision, [gps.lat+gps.lng]',
      species: 'id, chineseName, safetyLevel, toxicity.level',
      gallery: 'speciesId, addedAt',
    });
  }
}

export const db = new MushroomDatabase();

export async function initDB(speciesList: Species[]) {
  try {
    const count = await db.species.count();
    if (count === 0) {
      await db.species.bulkAdd(speciesList);
    }
  } catch (e) {
    console.warn('IndexedDB init failed, fallback to localStorage only', e);
  }
}

export async function saveRecordIndexedDB(record: CollectionRecord) {
  try {
    await db.records.put(record);
  } catch (e) {
    console.warn('Save record failed', e);
  }
}

export async function loadRecordsIndexedDB(): Promise<CollectionRecord[]> {
  try {
    return await db.records.orderBy('collectedAt').reverse().toArray();
  } catch {
    return [];
  }
}
