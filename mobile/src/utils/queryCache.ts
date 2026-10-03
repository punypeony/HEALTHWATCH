// Session-only cache: health records never persist to disk.
export type QuerySnapshot<T> = { data?: T; hasData: boolean; refreshing: boolean; error?: unknown };
type Entry = QuerySnapshot<unknown> & { pending?: Promise<void> };
type Event = "update" | "invalidate" | "clear";
const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<(event: Event) => void>>();

export function readQuery<T>(key: string): QuerySnapshot<T> {
  return (entries.get(key) ?? { hasData: false, refreshing: false }) as QuerySnapshot<T>;
}
function emit(key: string, event: Event) {
  listeners.get(key)?.forEach(listener => listener(event));
}
export function subscribeQuery(key: string, listener: (event: Event) => void) {
  const set = listeners.get(key) ?? new Set();
  listeners.set(key, set);
  set.add(listener);
  return () => { set.delete(listener); if (!set.size) listeners.delete(key); };
}
export function refreshQuery<T>(key: string, load: () => Promise<T>): Promise<void> {
  const previous = entries.get(key);
  if (previous?.pending) return previous.pending;
  const entry: Entry = { data: previous?.data, hasData: previous?.hasData ?? false, refreshing: true };
  entries.set(key, entry);
  entry.pending = Promise.resolve().then(load).then(data => {
    if (entries.get(key) !== entry) return;
    entry.data = data;
    entry.hasData = true;
  }).catch((error: unknown) => {
    if (entries.get(key) !== entry) return;
    entry.error = error;
    const status = (error as { status?: number } | null)?.status;
    if (status === 401 || status === 403 || status === 404) {
      entry.data = undefined;
      entry.hasData = false;
    }
  }).finally(() => {
    if (entries.get(key) !== entry) return;
    entry.refreshing = false;
    entry.pending = undefined;
    emit(key, "update");
  });
  emit(key, "update");
  return entry.pending;
}
export function invalidateQueries() {
  for (const [key, entry] of entries) {
    // Discard ownership of in-flight reads; old responses cannot overwrite a new refresh.
    entries.set(key, { data: entry.data, hasData: entry.hasData, refreshing: false });
    emit(key, "invalidate");
  }
}
export function clearQueryCache() {
  entries.clear();
  listeners.forEach((_, key) => emit(key, "clear"));
}
