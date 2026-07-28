---
title: "xcstringstool sync: The String Catalog Repair Tool Nobody Mentions"
description: "How to add missing keys, drop orphans, and rewrite a mangled Localizable.xcstrings back into Xcode's canonical format — from the command line, without losing translations."
slug: xcstringstool-sync-repair-string-catalog
keywords: ["xcstringstool sync", "localizable xcstrings", "string catalog missing keys", "xcstrings command line"]
queue: 7
status: queued
publishDate:
---

> **Quick answer:** `xcrun xcstringstool sync <catalog> --stringsdata <files>` merges extracted strings into a String Catalog from the command line — adding new keys, removing orphans, and rewriting the file in Xcode's canonical serialisation while preserving every existing translation. The `.stringsdata` files are produced by a build, under DerivedData.

Two problems with String Catalogs have the same solution, and it's a tool most people never touch.

## Problem one: command-line builds don't update the catalog

Xcode extracts localisable strings at build time and merges them into `Localizable.xcstrings`. **It only does that merge when you build from the IDE.** A `xcodebuild` invocation produces the extracted data but doesn't fold it back in.

That's fine until you rename a lot of strings without opening Xcode. The scenario that caught me: a project fork where every user-facing literal had been rewritten, all builds run from the command line. The catalog still held the *old* keys — all of them translated, none of them used — and **zero** of the new strings.

The result passes every check you'd think to run. The catalog reports no missing translations, because the keys it contains are fully translated. They're just not the keys the app displays any more. Every new string shipped unlocalised while every stale string sat there looking healthy.

**Auditing a catalog for missing translations is not enough. You also have to audit it for keys that no longer exist in the source, and for source strings that never reached it.**

## Problem two: something reformatted your catalog

The other way to end up here is a script. Round-trip a `.xcstrings` file through a JSON parser and re-serialise it, and you get a file that's semantically identical and textually unrecognisable — reordered keys, changed spacing, an 8,500-line diff for a five-key addition. Unreviewable, and a merge conflict generator.

The instinct is `git checkout` to undo it. **Don't** — that reverts to HEAD and destroys any uncommitted keys, including ones a previous session or another person added and hadn't committed. Those aren't in git, so they're gone.

## The fix for both

```bash
# Build once so the .stringsdata files exist.
xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' build

# Then merge them into the catalog.
find "$DERIVED_DATA/Build/Intermediates.noindex/MyApp.build/Debug-iphonesimulator/MyApp.build/Objects-normal/arm64" \
  -name '*.stringsdata' -print0 \
  | xargs -0 -n 400 xcrun xcstringstool sync Localizable.xcstrings --stringsdata
```

The `-n 400` matters — the file list can exceed argument limits on a large target, and batching avoids a confusing failure.

What `sync` does:

- **Adds** keys present in the source but missing from the catalog
- **Removes** orphans — keys the source no longer contains
- **Preserves** every existing translation, including hand-added entries marked `extractionState: "manual"`
- **Rewrites** the whole file in Xcode's canonical serialisation

That last point is why it doubles as the repair tool. A catalog mangled by a script comes back out in exactly the format Xcode itself would write, with nothing lost.

## Verify with a key-set diff, not a line count

The diff will be large either way, so line count tells you nothing. Compare the key sets:

```python
import json
before = set(json.load(open("catalog.before.json"))["strings"])
after  = set(json.load(open("Localizable.xcstrings"))["strings"])
print("lost:  ", sorted(before - after))
print("gained:", sorted(after - before))
```

On a repair, both should be empty. On a genuine sync, `lost` should contain only strings you deliberately deleted, and `gained` only ones you added. Anything unexpected in `lost` is a translation you're about to throw away.

## The one class of string sync can't see

Strings that never appear as a literal at a `Text(...)` call site aren't extracted at all. The common case is a helper that takes a `String` and converts internally:

```swift
CFSettingsRow(title: "Notifications")   // localised at runtime, never extracted
```

If the row renders `Text(LocalizedStringKey(title))`, the string works when translated but is invisible to extraction. Those keys must be added by hand with `extractionState: "manual"` — and `sync` will correctly leave them alone once they're there.

Worth a grep over your sources for such call sites, diffed against the catalog's key set. It's a one-line check that catches a category of silent gap nothing else will.
