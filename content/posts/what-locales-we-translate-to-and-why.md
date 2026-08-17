---
title: "What Locales We Translate To, and Why"
description: "Four languages are non-negotiable, another fifteen are nearly free, and English-only leaves most of the App Store unreachable. The reasoning behind the list."
slug: what-locales-we-translate-to-and-why
keywords: ["app store localization", "which languages to localize app", "ios app locales", "app store japan"]
queue: 3
status: published
publishDate: 2026-08-17
---

Every app we publish ships in at least five languages. Most ship in around twenty. Here's the reasoning, because "localise everything" is not a strategy and neither is "English is fine."

## The case against English-only

English-only isn't a neutral default. On the App Store, your metadata — name, subtitle, keywords — is indexed **per storefront**. An app with only English metadata is competing in the Japanese App Store using English keywords against apps using Japanese ones. You don't rank badly. You're largely invisible.

That's the part that surprises people. The cost of English-only isn't that Japanese users find your app and bounce off the language. It's that they never see it.

## The four that are non-negotiable

**Japanese, Korean, German, Simplified Chinese.**

Not because they're the four largest markets in raw population terms, but because of what they have in common: high-spending App Store storefronts, strong preference for native-language software, and — critically — much less competition from indie developers who stopped at English.

Japanese is the standout. It's a market where paid apps and one-off purchases still perform well, users are unusually willing to pay for something small that does its job, and the review culture rewards polish. It's also a market where a half-translated app is noticed immediately and reflected in reviews. There's no cheap way in; you either localise properly or you don't bother.

German brings a large European storefront with high purchase intent. Korean is small in absolute terms but dense and app-literate. Simplified Chinese is enormous, complicated for other reasons, and worth having metadata for regardless.

## The fifteen that are nearly free

Once an app is properly internationalised — every string in a catalogue, no hardcoded English, no layout that assumes short words — adding another language is a translation pass, not an engineering project. That changes the maths completely.

So we also ship, where it makes sense for the app: **French, Spanish, Portuguese (Brazil), Italian, Traditional Chinese, Thai, Vietnamese, Indonesian, Turkish, Russian, Arabic, Hindi, Dutch, Polish, Swedish.**

The reasoning is that the marginal cost is near zero and the marginal benefit is a storefront you were previously invisible in. Brazil, Turkey and Indonesia in particular have large, growing, under-served App Store audiences where an app with local-language metadata stands out disproportionately.

Arabic deserves a specific note: it requires right-to-left layout, which is a real engineering commitment rather than a translation pass. Test it properly or leave it out — a broken RTL layout is worse than an English one.

## Where it doesn't make sense

Not every app should ship in twenty languages.

An app whose content is inherently tied to one country — UK passport photo specifications, a Japanese return-gift custom, a fishing calendar tuned to one region's regulations — has a natural audience that a Swedish translation does not expand. Translating the interface while the content remains irrelevant produces an app that is technically available and practically useless, and that earns one-star reviews from confused users.

Our test: **does the app do something useful for someone in that country?** If the answer is no, the translation is a cost with no return, and the honest move is to not appear in that storefront pretending otherwise.

## Machine translation, and where it isn't enough

We use machine translation as the first pass, pooled across apps so the same phrases stay consistent everywhere — "Restore Purchases" should be identical in every app we ship, and a shared translation database is what makes that true rather than aspirational.

Where machine output isn't sufficient: anything with cultural weight, anything legal, and anything where a wrong word is unsafe rather than just awkward. Gift-giving etiquette, health-adjacent copy, and safety warnings get human review. A subtly wrong word in a settings toggle is a small embarrassment. A subtly wrong word in a warning is not.

## The one that pays for itself

If you ship one language beyond English, make it Japanese. The gap between "English-only" and "properly localised" is wider in that storefront than anywhere else, the competition among small developers is thinner, and the users are more willing to pay.

It's also the one that punishes half-measures hardest — which is a decent argument for [writing every string as a translated string from the start](/blog/we-translate-every-string-as-we-write-it) rather than deciding later.
