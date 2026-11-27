# Changelog

## 1.1.0

- Protected approved Live TV fallback during temporary discovery failures, preserved confirmed invalidations, and made rolling quota retry timing accurate. Added a bounded KTN source and the regional BBC rolling feed, plus ordered two-channel KBC discovery.

Prepared locally for owner verification.

- Added Live TV with Kenyan and selected international broadcasters, a searchable guide and station profiles.
- Added official broadcaster embeds where verified, with separate official viewing alternatives.
- Added optional current YouTube broadcast resolution for verified broadcaster channels, a bounded retry when a broadcast ends, and official station avatars across Live TV.
- Added station favorites, confirmed watch history, external-opening history and direct links.
- Preserved the existing movie and series catalogue, themes, footer and player appearance.

## 1.0.0

Prepared locally for the owner’s first stable release.

- Expanded the original movie catalogue into movie and TV discovery with advanced filters, title and People search, and episode navigation.
- Added the cinematic homepage, responsive detail pages, light and dark themes, and reduced-motion support.
- Added profiles, filmographies, collections, recommendations, regional Where to Watch, and the release calendar.
- Added browser-local Favorites, Watchlist, viewing history, watched status, and Continue Watching.
- Added trailers and two verified full-content YouTube embeds with resume support.
- Verified same-origin API validation, local persistence, route behavior, and production compilation. Added release response headers and a post-deployment HTTP check.

Dynamic streaming-provider integration was skipped. This release depends on TMDB for discovery and YouTube for the supported embeds.
