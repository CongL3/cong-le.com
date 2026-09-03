---
title: "Your App's Locale Codes Aren't Fastlane's Locale Codes"
description: "xcstrings uses de and fr. fastlane/metadata needs de-DE and fr-FR, and a bare directory fails the lane hard. The mapping, and how to check it before a release."
slug: fastlane-metadata-locale-codes-differ
keywords: ["fastlane metadata locales", "deliver unsupported locale", "app store connect locale codes", "fastlane deliver locale error"]
queue: 8
status: queued
approved: true
publishDate:
---

> **Quick answer:** In-app localisation and App Store Connect metadata use different locale identifiers. `Localizable.xcstrings` uses `de`, `fr`, `es`, `ar`; `fastlane/metadata/` needs `de-DE`, `fr-FR`, `es-ES`, `ar-SA`. A bare `de/` directory makes `deliver` abort, and it aborts *after* uploading the locales it did understand.

You add German to an app. In the String Catalog it's `de`. So you create `fastlane/metadata/de/`, fill in the description and keywords, run the metadata lane, and it fails.

The reason is that these are two unrelated systems that happen to both call their identifiers "locales". Xcode uses language codes. App Store Connect uses its own list, and several entries are region-qualified.

## The mapping that catches people

| Language | In-app (`xcstrings`) | Metadata (`fastlane/metadata/`) |
|---|---|---|
| German | `de` | **`de-DE`** |
| French | `fr` | **`fr-FR`** |
| Spanish | `es` | **`es-ES`** |
| Arabic | `ar` | **`ar-SA`** |
| Portuguese (Brazil) | `pt-BR` | `pt-BR` |
| Japanese | `ja` | `ja` |
| Korean | `ko` | `ko` |
| Chinese (Simplified) | `zh-Hans` | `zh-Hans` |

The inconsistency is the trap. Japanese and Korean are bare, German and French are not, and there's no principle to derive it from — you either know or you find out during a release.

Also note `es-ES` is Spain specifically; Latin American Spanish is `es-MX`, a separate storefront locale. And `en-US` and `en-GB` are distinct, which matters if your copy uses "color" or "colour".

## Why the failure is annoying

`deliver` validates locale directories as it goes rather than up front. So an unsupported directory aborts the lane **after** it has already uploaded the locales it understood.

You're left in a partial state: some locales updated, some not, and a lane you have to re-run. Nothing is broken, but "did that upload or not?" is a question you now have to answer by looking at App Store Connect.

## Check before you run

A three-line guard beats reading the error:

```bash
VALID="ar-SA ca cs da de-DE el en-AU en-CA en-GB en-US es-ES es-MX fi fr-CA fr-FR he hi hr hu id it ja ko ms nl-NL no pl pt-BR pt-PT ro ru sk sv th tr uk vi zh-Hans zh-Hant"
for d in fastlane/metadata/*/; do
  loc=$(basename "$d")
  case " $VALID " in
    *" $loc "*) ;;
    *) echo "unsupported metadata locale: $loc" ;;
  esac
done
```

Skip the non-locale directories your setup uses — `review_information`, `trade_representative_contact_information` and similar live alongside the locales and aren't locales.

## While you're checking, check the lengths

The other thing that fails an upload late is a field one character over its limit. The limits worth guarding:

- **App name** — 30 characters
- **Subtitle** — 30
- **Keywords** — 100, commas included
- **Promotional text** — 170
- **What's New** — 4,000

One over and the upload is rejected, per locale, after other locales have gone up.

A detail that costs a confusing minute: `wc -m` counts the trailing newline. A 30-character name in a file reports 31. Strip it before comparing, or you'll "fix" a field that was already fine:

```bash
printf '%s' "$(cat fastlane/metadata/en-GB/name.txt)" | wc -m
```

## The general shape

Both of these are the same class of problem: a validation that happens remotely, per-item, partway through a batch. The fix is the same too — validate locally before you start, because the local check is instant and the remote one costs you a partial upload and a rerun.

Worth putting in a preflight lane so it runs on every release rather than when someone remembers.
