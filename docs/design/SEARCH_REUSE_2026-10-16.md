# Search reuse — 2026-10-16

Text search now shares one dedicated worker per browser tab. Opening a selector,
recognizing a direct reference and Home's book-only preview do not start it.
The Bible catalogue retains its existing book-plus-verse search behavior.

The broker assigns globally increasing request IDs, validates response metadata,
and cancels each caller independently. Changing a query, version or route cannot
publish a stale response. A worker error rejects affected requests and allows a
fresh attempt; index fetch and JSON parsing have a 12-second deadline. UI retry
repeats the same query explicitly without a retry loop.

Only one prepared translation is retained in the worker. In-flight loads are
deduplicated by version, including A→B→A, and an older completion cannot replace
the most recently requested cache. A version change can temporarily allocate a
new index while the prior one is resident. The worker and its memory are released
after two minutes with no requests. Raw JSON size does not measure heap usage.

## Counted baseline and result

The original worker at `805df30` was executed with its real engine and NBLA JSON
in isolated Node VM contexts. Two words in the same instance used one fetch,
parse and preparation. Three successive instances used three of each.

The replacement counter harness uses the actual broker, worker handler, index
repository, engine and NBLA corpus, substituting only message/network transport.
It repeats the same three-caller sequence before idle expiry. It must count:

| Scenario | Workers/contexts | Fetch calls | JSON parses | Preparations |
| --- | ---: | ---: | ---: | ---: |
| Original: three successive instances | 3 | 3 | 3 | 3 |
| Shared: three successive callers | 1 | 1 | 1 | 1 |

NBLA corpus at measurement: 4,418,577 bytes and 31,103 entries. These are controlled
operation counts. They are not mobile latency, heap size, transfer compression,
or proof that every original fetch was a network download rather than a cache hit.

Reproduce the current counted pipeline from the repository root:

```sh
node scripts/audit-search-reuse.mjs
```

The baseline used the original worker from `git show 805df30:src/workers/searchWorker.js` with its real engine and corpus. It ran two queries in one context, then repeated the sequence with three isolated contexts; fetch, JSON.parse and prepareSearchEntries were counted at their boundaries.

## Verification

Unit coverage includes concurrent callers, reverse responses, cancellation,
stale queries/translations, pagination failures, same-query retry, index dedup,
timeouts, worker failures, invalid versions and idle release. Browser coverage
counts one worker and one index request across Home→Reader→Search, checks direct
references start no worker, and retries a first-failed index on all three search
surfaces. Browser timing is intentionally not claimed from these checks.
