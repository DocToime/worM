import { registerSW } from 'virtual:pwa-register';

type Listener = (needRefresh: boolean) => void;
const listeners = new Set<Listener>();
let needRefresh = false;
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function subscribeNeedRefresh(listener: Listener) {
  listeners.add(listener);
  listener(needRefresh);
  return () => { listeners.delete(listener); };
}

export function applyPwaUpdate() {
  if (!updateSW) return Promise.resolve();
  return updateSW(true);
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true;
      for (const listener of listeners) listener(true);
    },
  });
}
