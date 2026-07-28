---
title: "We Translate Every String As We Write It"
description: "Why retrofitting localisation into an iOS app always leaks, and the SwiftUI patterns that silently break translation without warning you."
slug: we-translate-every-string-as-we-write-it
keywords: ["ios localization workflow", "swiftui localization", "xcstrings", "localizedstringkey"]
queue: 2
status: queued
publishDate:
---

The plan is always the same: build the app in English, localise it before launch. It never works, and the reason isn't laziness. It's that "find every user-facing string" is a search problem with no reliable query.

## What retrofitting misses

By the time you go looking, the English is distributed across places you won't think to check:

- The error message that only appears when the network drops mid-save.
- The empty state nobody has seen since week one, because there's always test data.
- The accessibility label on an icon-only button.
- The confirmation dialog on a destructive action.
- The `plural` case you wrote in a hurry: `"\(n) item" + (n == 1 ? "" : "s")`.
- Notification bodies, assembled in a background task.
- Widget copy, which lives in a different target entirely.

You can grep for `Text(`. You cannot grep for "strings a user might one day see." Every retrofit pass I've done has missed something, and the misses surface as a screenshot from a Japanese user with one English sentence in the middle of an otherwise translated screen.

Writing the translation at the moment you write the string costs almost nothing — you're already in the file, already thinking about the sentence. Doing it later costs a day per app and still leaks.

## SwiftUI will break your localisation without telling you

This is the part worth internalising, because there's no warning and no error. It compiles, it runs, it displays English.

`Text("Save")` localises automatically, because the literal becomes a `LocalizedStringKey`. Break the literal in any way and that stops:

```swift
// Localises.
Text("Save")

// Does NOT localise — the ternary produces a String, not a key.
Text(isEditing ? "Save" : "Done")

// Does NOT localise — it's a variable.
let label = "Save"
Text(label)

// Does NOT localise — interpolation of a non-literal.
Text("Hello, \(name)")   // the surrounding literal is fine; be careful what you build
```

The fix for the ternary is to wrap each branch, so each is still a literal at the point of lookup:

```swift
Text(isEditing ? String(localized: "Save") : String(localized: "Done"))
```

And note `String(localized:)` has the same constraint in reverse — it takes a literal. `String(localized: someVariable)` will not do what you want.

## Reusable views need the right parameter type

The second silent failure. You write a helper:

```swift
struct Row: View {
    let title: String          // ← this is the bug
    var body: some View { Text(title) }
}
```

Every call site passes a literal, everything looks correct, and nothing localises — because by the time the literal reaches `Text`, it's a `String`. Take a `LocalizedStringKey` instead:

```swift
struct Row: View {
    let title: LocalizedStringKey
    var body: some View { Text(title) }
}
```

Now `Row(title: "Save")` localises, because the literal is converted to a key at the call site.

## Framework strings live in the app, not the framework

A subtle one if you share UI across apps. If a shared package renders "Restore Purchase", the lookup happens against the *app's* bundle, not the package's. Those keys have to exist in each app's string catalogue, or they fall back to English in every app that uses the shared component — which is all of them.

It's the kind of bug that hides well: the app's own screens are perfectly translated, and one button in a shared settings row isn't.

## Audit anyway

Even writing strings as you go, we run an audit script before shipping that walks the source for user-facing text with no matching catalogue entry. Not because the discipline fails often, but because the cost of the check is seconds and the cost of a miss is a user seeing half a translated screen and reasonably concluding the app is sloppy.

The discipline is the mechanism. The audit is the seatbelt.

## The actual argument

None of this is about being thorough for its own sake. Retrofitted localisation produces apps that are 95% translated, and a 95% translated app reads worse than an English one — because the English fragment appears exactly at the moment something has gone wrong, in the error message, when the user is already frustrated and least able to guess.

Which languages, and why those, is [a separate question](/blog/what-locales-we-translate-to-and-why).
