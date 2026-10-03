# Focused query cache

Dependents, Overview, History, Alerts and Intake use session-only in-memory data.
Query keys include the dependent ID and resource. The scanner's daily-limit note
shares the Intake entry; actual scans and intake confirmations always call the API.

On focus, display the last successful value immediately and revalidate in the
background. Concurrent reads of the same key share one request. A failed refresh
keeps data visible with a retry notice; 401/403/404 discard inaccessible records.
GET requests time out after 15 seconds. No data is saved to disk by this cache.

Successful authenticated writes invalidate all query entries because scans and
meal edits affect several resources. Focused queries refresh immediately; other
queries refresh when revisited. Replaced entries reject obsolete read results.
Changing/clearing the session token clears all entries, including on logout.

Run `node scripts/test-query-cache.cjs` for cache behavior checks and
`npx tsc --noEmit` for type checking. Device interaction testing remains separate.
