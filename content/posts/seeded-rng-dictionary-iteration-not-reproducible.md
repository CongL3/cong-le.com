---
title: "Your Seeded Simulation Isn't Reproducible If It Iterates a Dictionary"
description: "Swift randomises Dictionary iteration order per process. Draw from a seeded RNG inside that loop and the same seed produces different results on every launch."
slug: seeded-rng-dictionary-iteration-not-reproducible
keywords: ["swift dictionary iteration order", "seeded random not reproducible", "deterministic simulation swift", "swift hash seed randomization"]
queue: 13
status: queued
publishDate:
---

> **Quick answer:** Swift randomises `Dictionary` iteration order per process using a per-launch hash seed. If you draw from a seeded RNG inside a `for (key, value) in someDictionary` loop, each key gets a different draw depending on visit order — so the same seed gives different results every run. Sort the keys at the draw site.

A balance harness ran a thousand simulated lives with a fixed seed. Same seed, same code, same inputs — it should produce the same number every time.

It didn't. Three runs, median net worth:

```
$8,287,795
$8,134,603
$8,039,798
```

The third of those followed a commit that changed a *display name* — copy on a label, nothing the simulation can read. So every bit of that movement was noise by construction.

## The cause

```swift
for (id, delta) in effect.stats {          // [String: Double]
    let jitter = Double.random(in: -j...j, using: &rng)
    apply(id, delta + jitter)
}
```

Swift randomises `Dictionary` iteration order **per process**. It's deliberate — hash seeding is randomised at launch to prevent hash-flooding attacks, and Apple is explicit that dictionary order is not guaranteed.

So on one launch the loop visits `strength` then `charisma`; on the next, the reverse. The RNG is seeded and produces the same *sequence* every time — but which stat receives which draw changes. Same numbers, different recipients, different outcome.

The seed is doing its job perfectly. The dictionary is the non-determinism.

## Why it hides so well

The drift is small. Measured across three runs it was roughly **3% on net worth**, ±13 on branch counts, one year on median age. Every individual number looks plausible.

Which produces a specific, expensive failure mode: a report that claims to be diffable, isn't. If your workflow is "run the harness before and after a change, diff the numbers", then small real regressions are indistinguishable from noise, and a genuine regression can hide inside the band entirely. Large effects still show — a money-faucet fix moved the figure fivefold — but the resolution you thought you had is gone.

Worth noting a sampling trap on top: two runs suggested a ~2% band. The third widened it to 3%. **A noise band from two samples is a floor, not the band.**

## The fix

Impose a total order at the point of the draw:

```swift
for (id, delta) in effect.stats.sorted(by: { $0.key < $1.key }) {
    let jitter = Double.random(in: -j...j, using: &rng)
    apply(id, delta + jitter)
}
```

Sorting *only where randomness is consumed* is enough. Iterating a dictionary to sum values is fine — addition commutes. The rule is narrower than "never iterate dictionaries": **any unordered iteration that consumes a seeded RNG, or that feeds an order-dependent accumulator, needs a total order.**

Note `.sorted` on a `String` key uses Swift's `<`, which is lexical and locale-independent. If you sort with a localised comparator you've reintroduced the problem in a different form — the order now depends on the user's region.

## The test that catches it

The reason this survived so long is that no test asserted the property. Same-seed reproducibility is one line:

```swift
@Test func sameSeedGivesSameResult() {
    let a = BalanceHarness.run(lives: 200, seed: 42)
    let b = BalanceHarness.run(lives: 200, seed: 42)
    #expect(a == b)
}
```

If that fails, something in the pipeline is unordered. It catches dictionary iteration, `Set` iteration, unordered concurrency, and anything else that sneaks in later — without you having to know where the problem is.

Add it the day you add a seed.

## The heuristic worth keeping

**If a seeded simulation's output moves when nothing semantic changed, suspect unordered iteration before you suspect the change.**

The instinct is to go and re-read the diff, because the numbers moved right after a commit and that must be why. But a commit that only touched a label cannot move a simulation — and once you accept that, the search space collapses to "what in this pipeline isn't ordered?"

None of this is Swift-specific, either. Go randomises map iteration explicitly. Python guarantees insertion order for dicts but not for sets. Any language where a hash container's order isn't part of the contract has this bug available.
