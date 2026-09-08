import { validateSaveEnvelope, type SaveEnvelopeV1, type SaveSlot, type SaveStorePort } from '../../domain/save/saveContract';
import type { ProfileId } from '../../domain/profiles/profile';

const DB_NAME = 'treasure-pop-wonderlands';
const DB_VERSION = 1;
const STORE = 'saves';

interface StoredSave { key: string; profileId: ProfileId; slot: SaveSlot; save: SaveEnvelopeV1; }

export class IndexedDbSaveStore implements SaveStorePort {
  public async read(profileId: ProfileId, slot: SaveSlot): Promise<SaveEnvelopeV1 | null> {
    const db = await openDatabase();
    const row = await request<StoredSave | undefined>(db.transaction(STORE, 'readonly').objectStore(STORE).get(key(profileId, slot)));
    db.close();
    if (!row) return null;
    return validateSaveEnvelope(row.save, profileId).valid ? row.save : null;
  }

  public async write(profileId: ProfileId, slot: SaveSlot, save: SaveEnvelopeV1): Promise<void> {
    if (!validateSaveEnvelope(save, profileId).valid) throw new Error('Refusing to persist an invalid save.');
    const db = await openDatabase();
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put({ key: key(profileId, slot), profileId, slot, save } satisfies StoredSave);
    await transactionDone(transaction);
    db.close();
  }

  public async deleteProfile(profileId: ProfileId): Promise<void> {
    const db = await openDatabase();
    const transaction = db.transaction(STORE, 'readwrite');
    for (const slot of ['current', 'previous', 'lastKnownGood'] as const) transaction.objectStore(STORE).delete(key(profileId, slot));
    await transactionDone(transaction);
    db.close();
  }
}

function key(profileId: ProfileId, slot: SaveSlot): string { return `${profileId}:${slot}`; }
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => { if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE, { keyPath: 'key' }); };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error ?? new Error('IndexedDB open failed.'));
  });
}
function request<T>(value: IDBRequest<T>): Promise<T> { return new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error ?? new Error('IndexedDB request failed.')); }); }
function transactionDone(transaction: IDBTransaction): Promise<void> { return new Promise((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.')); transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.')); }); }
