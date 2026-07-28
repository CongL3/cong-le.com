---
title: "A .DS_Store File Will Break Your Screenshot Upload"
description: "Upload tools that read image dimensions try to decode every file in the directory — so a Finder artefact you can't see aborts the whole batch with 'image: unknown format'."
slug: ds-store-breaks-app-store-screenshot-upload
keywords: ["ds_store screenshot upload", "image unknown format app store", "app store connect screenshot upload error", "fastlane deliver ds_store"]
queue: 16
status: queued
publishDate:
---

> **Quick answer:** Screenshot upload tools decode the dimensions of every file in the target directory. A `.DS_Store` isn't an image, so the whole batch aborts with `image: unknown format`. It's gitignored and hidden in Finder, so the folder looks empty of it. Sweep with `find . -name .DS_Store -delete` before uploading.

The error names a file you didn't put there:

```
Error: screenshots upload: decode image dimensions for ".../.DS_Store": image: unknown format
```

Nothing is wrong with your screenshots. A tool that reads image dimensions to work out which display class each file belongs to walks **every** file in the directory, hits a Finder artefact, fails to decode it, and gives up on the batch.

## Why it's invisible

`.DS_Store` is uniquely well hidden:

- Hidden in Finder by default
- Hidden by `ls` without `-a`
- In your global gitignore, so `git status` never shows it
- Created silently, just by opening the folder in Finder to check the screenshots look right

That last one is the sting. The act of *verifying your screenshots* is what creates the file that breaks the upload.

## The fix

```bash
find fastlane/screenshots -name '.DS_Store' -delete
```

Put it in the lane rather than in your memory, immediately before the upload step. It costs nothing and removes the class of failure permanently.

If you'd rather stop them appearing on network volumes at all:

```bash
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
```

That only covers network shares — local folders still get them, so keep the sweep.

## The wider class of bug

This is worth generalising, because the same shape catches people elsewhere: **a tool that processes "every file in a directory" will eventually meet a file that isn't yours.**

The usual suspects:

- `.DS_Store` — Finder
- `Thumbs.db` — Windows, in a shared repo
- `._filename` — AppleDouble resource forks, from copying to a non-Mac filesystem
- `.gitkeep` — someone's empty-directory placeholder
- Editor swap files and `*~` backups
- `@eaDir` — Synology NAS thumbnails

Any pipeline that globs a directory should filter to the extensions it actually wants rather than trusting the directory to contain only expected things:

```bash
find fastlane/screenshots -type f \( -name '*.png' -o -name '*.jpg' \)
```

That's the more robust version of the fix — it doesn't matter what junk appears, because you never look at it.

## Adjacent screenshot-upload traps

While you're in there, two others that fail late for similar reasons:

**Unsupported locale directories.** Screenshot and metadata directories are keyed by App Store Connect locale, and a directory name the tool doesn't recognise aborts the run — after it has already uploaded the locales it did understand. `de` instead of `de-DE` is the usual culprit.

**Wrong dimensions for the display class.** Each device family expects exact pixel sizes. A screenshot one pixel off, or captured on a simulator whose scale factor you didn't expect, is rejected for that display type only — so part of the set uploads and part doesn't.

All three share a shape: validation happens remotely, per item, partway through a batch, leaving you in a partial state. Which is the real lesson — **validate the directory locally before you start uploading**, because the local check is instant and the remote one costs a partial upload and a rerun.
