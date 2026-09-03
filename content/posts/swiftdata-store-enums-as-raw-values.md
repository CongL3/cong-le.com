---
title: "SwiftData Enum Predicates: Store a Queryable Raw Value"
description: "SwiftData can persist Codable enums, but current #Predicate expressions cannot compare enum cases. Store a raw value when you need filtering or sorting."
slug: swiftdata-store-enums-as-raw-values
keywords: ["swiftdata enum property", "swiftdata predicate enum", "swiftdata codable enum cloudkit", "swiftdata cannot use enum in predicate"]
queue: 6
status: queued
approved: true
publishDate:
---

> **Quick answer:** SwiftData can persist a `Codable` enum property, as Apple's documentation demonstrates, but current `#Predicate` expressions cannot use an enum case as a query key. If the value needs filtering or sorting, store an explicit raw `String` or `Int` column and expose the enum through a computed property.

This one looks fine, persists fine, and then the query fails.

```swift
enum Status: String, Codable {
    case draft, active, archived
}

@Model
final class Entry {
    var status: Status = Status.draft
}
```

Then you try to filter:

```swift
FetchDescriptor<Entry>(
    predicate: #Predicate { $0.status == Status.active }   // won't work
)
```

On the current Swift 6.3 SDK, the predicate macro rejects the enum case with
`key path cannot refer to enum case 'active'`. Older SDKs can surface the same
limitation later as an unsupported predicate, so include the OS and SDK version
in the bug report.

## What's actually happening

There are two separate questions here: can SwiftData persist the property, and
can the query system translate a comparison against it? Apple's SwiftData
documentation shows a `Codable` enum as a model property, so persistence itself
is supported. The current predicate macro still needs a queryable stored value;
it cannot turn an enum-case member access into a supported key path.

If you explicitly opt into `@Attribute(.codable)`, Apple describes the encoded
representation as opaque to SwiftData: it cannot be used in predicates or sort
descriptors. That is a useful rule for custom Codable types, but it is not a
reason to describe every directly declared enum property as a composite
CloudKit field.

The practical result is the same when you need a filtered fetch: use a plain
stored value as the query boundary instead of fetching everything and filtering
in memory.

## The fix

Store the raw value; keep the enum in the API.

```swift
enum Status: String, Codable, CaseIterable {
    case draft, active, archived
}

@Model
final class Entry {
    // Persisted. Note the default — CloudKit requires one on the declaration.
    var statusRaw: String = Status.draft.rawValue

    // Not persisted; @Model ignores computed properties.
    var status: Status {
        get { Status(rawValue: statusRaw) ?? .draft }
        set { statusRaw = newValue.rawValue }
    }
}
```

Now the predicate works, because it's comparing a plain string:

```swift
let active = Status.active.rawValue
FetchDescriptor<Entry>(
    predicate: #Predicate { $0.statusRaw == active }
)
```

Note the local binding. `#Predicate` won't let you call `.rawValue` inside the closure — pull the value out first and capture it.

This is a queryability recommendation, not a blanket CloudKit prohibition on
enums. If you are not filtering the value, Apple's direct Codable enum model can
be appropriate. If you do need a stable query key, making the raw column
explicit also makes the persisted contract easier to inspect and migrate.

## Handling the unknown case

The `?? .draft` in that getter is doing real work, and it's worth thinking about rather than copying.

A synced store can hand you a raw value your build doesn't recognise: a newer version of the app added `case published`, wrote it, and an older device syncs it down. `Status(rawValue:)` returns nil, and if you force-unwrap, that device crashes on data it was never going to understand.

Falling back to a sensible default keeps the app running. If losing the distinction matters, keep the original string around so a later version can recover it rather than overwriting it with the fallback on the next save.

## `String` or `Int`?

**Prefer `String`.** An automatically assigned `Int` raw value couples your
persisted data to declaration order — insert a case in the middle and every
stored row can silently mean something different. Explicit integer values avoid
that particular problem, but strings remain self-describing and easier to
inspect.

String raw values are self-describing. You can read the store and understand it, and reordering cases is harmless.

## The general rule

**Persist primitives; expose types.** The persisted layer wants strings, numbers, dates and booleans, because those are what stores can index, query and sync. Rich types belong in the computed layer on top, where Swift's type system does its job and the store never sees them.

Same reasoning applies to anything else you might be tempted to make Codable on
a model — a small struct of settings, a coordinate pair, or a set of flags. If
you'll ever want to filter or sort on a value, give that query key its own
supported stored column instead of relying on an opaque encoded representation.

## Sources

- [Defining data relationships with enumerations and model classes](https://developer.apple.com/documentation/swiftdata/defining-data-relationships-with-enumerations-and-model-classes)
- [Schema.Attribute.Option](https://developer.apple.com/documentation/swiftdata/schema/attribute/option)
- [What's new in SwiftData — WWDC26](https://developer.apple.com/videos/play/wwdc2026/274/)
