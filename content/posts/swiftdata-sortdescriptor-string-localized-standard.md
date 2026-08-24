---
title: "SwiftData's String SortDescriptor Isn't Sorting How You Think"
description: "A SortDescriptor on a String key path defaults to .localizedStandard, which is numeric-aware and locale-dependent — so it disagrees with Swift's < and changes per user."
slug: swiftdata-sortdescriptor-string-localized-standard
keywords: ["swiftdata sortdescriptor", "swiftdata sort order wrong", "localizedstandard comparator", "swift sortdescriptor string"]
queue: 4
status: published
publishDate: 2026-08-24
---

> **Quick answer:** `SortDescriptor` on a `String` key path uses `.localizedStandard` by default, which compares numerically ("4" before "12") and depends on the user's locale. That disagrees with Swift's `<`, so a fetch-level sort and any in-memory re-sort silently diverge. If you need a deterministic order, pass `comparator: .lexical`.

Here's a bug that survives every test you're likely to write.

A fetch sorted by a string identifier returned `4F3C…` before `12A3…`. Not a crash, not an error — just an order that made no sense until you notice what it's doing: reading the leading `4` and `12` as *numbers*, and putting 4 before 12.

```swift
// Numeric-aware and locale-dependent. Probably not what you meant.
FetchDescriptor<Card>(sortBy: [SortDescriptor(\.code)])
```

## Why it happens

`SortDescriptor`'s initialiser for `String` key paths defaults its comparator to `.localizedStandard` — the same "Finder-like" comparison that puts `file2` before `file10`. It's the right default for filenames and titles shown to a person. It's the wrong default for anything you intend as an identifier.

Two consequences follow, and the second is worse.

**It disagrees with Swift's `<`.** Sort the same array in memory and you get a different order:

```swift
let fetched = try context.fetch(FetchDescriptor<Card>(sortBy: [SortDescriptor(\.code)]))
let inMemory = cards.sorted { $0.code < $1.code }
// These do not match.
```

So a fetch-level sort and any later re-sort quietly diverge. If part of your code trusts the fetch order and part re-sorts, you get two different truths for the same data.

**It changes with the user's locale.** `.localizedStandard` is, unavoidably, localised. The order your Japanese users see is not necessarily the order your British users see. If that ordering feeds anything deterministic — a seeded shuffle, a stable tiebreak, a sync reconciliation, a checksum over ordered rows — you have a bug that only reproduces on someone else's device.

## Why your tests pass

This is the part that costs the afternoon.

The order is **stable**. Fetch twice, get the same answer both times. So the obvious test —

```swift
let a = try context.fetch(descriptor)
let b = try context.fetch(descriptor)
#expect(a.map(\.code) == b.map(\.code))   // passes
```

— passes cleanly and tells you nothing. Determinism across repeated fetches is not the property you care about. The properties you care about are *agreement with `<`* and *independence from locale*, and neither is what the test asserts.

The test that catches it compares the fetch against an explicit expected order:

```swift
let fetched = try context.fetch(FetchDescriptor<Card>(sortBy: [SortDescriptor(\.code)]))
#expect(fetched.map(\.code) == ["12A3", "4F3C"])   // fails — you get 4F3C first
```

## The fix

Pass the comparator explicitly whenever the string is an identifier rather than display text:

```swift
FetchDescriptor<Card>(sortBy: [SortDescriptor(\.code, comparator: .lexical)])
```

`.lexical` compares by Unicode scalar, matches Swift's `<`, and doesn't care about locale.

The rule worth adopting: **`.localizedStandard` for anything a human reads, `.lexical` for anything a machine relies on.** Titles, names and labels want the friendly ordering — users expect "Episode 2" before "Episode 10". Codes, identifiers, hashes and tiebreak keys want the boring one.

## The related trap

While you're here: `UUID` isn't `Comparable` in Swift, so it can't be a fetch-level sort key at all. If you're using a UUID as a stable tiebreak, store it as a `String` alongside — and sort that string with `.lexical`, for exactly the reasons above.

That combination — UUID stored as a string, sorted with the default comparator — is how you end up with a "deterministic" ordering that silently differs between two devices in different regions.
