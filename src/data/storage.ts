import type { Preferences, Profile, Session } from '../core/types';
import { defaults } from '../core/protocol';
let dbPromise: Promise<IDBDatabase> | undefined;
function database(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('worm-garden', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('profiles', { keyPath: 'id' });
      db.createObjectStore('sessions', { keyPath: 'id' });
      db.createObjectStore('preferences');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = undefined; reject(request.error); };
    request.onblocked = () => reject(new Error('Storage upgrade blocked by another tab'));
  });
  return dbPromise;
}
async function getAll<T>(store: string): Promise<T[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function get<T>(key: string): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('preferences').objectStore('preferences').get(key);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function put(store: string, value: unknown, key?: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    if (key) tx.objectStore(store).put(value, key); else tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}
let writeQueue: Promise<void> = Promise.resolve();
export function saveSession(session: Session) {
  const snapshot = structuredClone(session);
  const next = writeQueue.catch(() => {}).then(() => put('sessions', snapshot));
  writeQueue = next; return next;
}
export const saveProfile = (p: Profile) => put('profiles', p);
export const savePreferences = (p: Preferences) => put('preferences', p, 'settings');
export const setActiveProfile = (id: string) => put('preferences', id, 'activeProfile');
export const listSessions = () => getAll<Session>('sessions');
export function newProfile(name = 'Gardener'): Profile { return { id: crypto.randomUUID(), name, learned: false, createdAt: new Date().toISOString() }; }
export async function loadData() {
  const [profiles, sessions, prefs, activeId] = await Promise.all([getAll<Profile>('profiles'), listSessions(), get<Preferences>('settings'), get<string>('activeProfile')]);
  if (!profiles.length) { const p = newProfile(); await saveProfile(p); profiles.push(p); }
  return { profiles, sessions, prefs: { ...defaults, ...prefs }, activeId: profiles.some(p => p.id === activeId) ? activeId! : profiles[0].id };
}
export async function deleteProfile(id: string) {
  await writeQueue.catch(() => {});
  const sessions = await listSessions(), db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['profiles', 'sessions'], 'readwrite');
    tx.objectStore('profiles').delete(id);
    sessions.filter(s => s.participantId === id).forEach(s => tx.objectStore('sessions').delete(s.id));
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}
