# SimpleCache — production review

Context: thousands of reads/s, hundreds of writes/s, tens of concurrent threads. Below are issues that should be fixed before shipping, ordered by severity.

## 1. Expired entries are never removed (critical)

`get()` returns `null` when an entry is past TTL, but the entry stays in the map. Under a workload with many distinct keys (or keys that are written once and rarely rewritten), the map accumulates dead entries indefinitely.

**Impact:** Memory grows without bound. GC pressure rises. `size()` reports living + expired entries, so any monitoring or capacity logic based on `size()` is wrong. In the worst case this leads to OOM under sustained unique-key traffic.

## 2. No capacity bound or eviction policy (critical)

Even with perfect TTL cleanup, `ConcurrentHashMap` has no max size. Hundreds of writes per second of new keys will grow the cache until the heap is exhausted.

**Impact:** Unbounded memory use under write-heavy or high-cardinality workloads. Production caches need a hard size limit (LRU / W-TinyLFU / size-based eviction) so the process stays within its memory budget.

## 3. Wall-clock time for TTL (high)

TTL is computed with `System.currentTimeMillis()`. That clock can jump forward or backward (NTP, VM pause/resume, manual adjustment).

**Impact:** A forward jump expires entries early (cache thrashing, stampede on the backing store). A backward jump keeps entries “fresh” far past the intended TTL (stale reads). Prefer `System.nanoTime()` for elapsed duration, or inject a `Clock` for tests.

## 4. Non-atomic expire-on-read (medium–high)

`get()` does check-then-act: read entry, decide freshness, return. There is no removal of the expired entry, and there is no atomic “return value if fresh else remove” path. Concurrent `get`/`put` on the same key is mostly safe because `ConcurrentHashMap` replaces entries atomically, but expired entries still linger and `size()` remains misleading.

**Impact:** Correctness of returned values is usually fine for a single put/get pair, but memory accounting and any future “cleanup on get” logic need something like `computeIfPresent` so expire + remove is one map operation.

## 5. Incomplete cache API (medium)

Hardcoded 60s TTL, no `invalidate` / `clear`, no per-key TTL, no bulk load helpers. Callers cannot react to data changes (writes elsewhere, admin flush, config updates).

**Impact:** Stale data after external updates; awkward operational control; forces workarounds outside the cache.

## 6. Cache stampede on miss (medium)

This class only stores values; it does not load them. Under high read QPS, when a popular key expires, many threads can miss at once and each hit the backing store (if callers implement load-on-miss naively).

**Impact:** Spikes of load on the database or remote service right when TTL windows align. A production design usually needs single-flight / refresh-ahead (or Caffeine’s `LoadingCache` / async refresh).

## 7. Null contract (low–medium)

`ConcurrentHashMap` does not allow null keys (and typically null values are also rejected depending on API usage). The class does not document or validate this.

**Impact:** Unexpected `NullPointerException` at the boundary if callers pass null. Document and reject nulls explicitly.

## 8. What I would ship instead

For this load profile I would not invent a cache. Prefer **Caffeine** (or Guava Cache if already on the classpath) with:

- maximum size (and optionally weight)
- expire-after-write (and/or expire-after-access) using a reliable ticker
- optional `LoadingCache` / `AsyncLoadingCache` for stampede protection
- metrics (hit rate, eviction count, size)

If a minimal custom cache were required, I would keep `ConcurrentHashMap`, add a max size with eviction, remove expired entries on read via `computeIfPresent`, run a background sweeper for idle expired keys, and use monotonic time for TTL.

### Sketch of a safer `get` (illustrative only)

```kotlin
fun get(key: K): V? {
    var result: V? = null
    cache.computeIfPresent(key) { _, entry ->
        if (ticker() - entry.timestamp < ttlMs) {
            result = entry.value
            entry
        } else {
            null // remove
        }
    }
    return result
}
```

This still needs a capacity limit and a better ticker before it would be production-ready.
