# MovieExplorer design system

**Baseline version 7 · 2026-11-26 · Phase 8B cinematic refinement**

This is the current local visual baseline. Phases 5–8B are implemented locally and await owner deployment. The Phase 8 palette below remains the basis of dark mode. The current dual-theme refinements are documented at the end. See [architecture](ARCHITECTURE.md) and [README](README.md).

## Creative direction

MovieExplorer uses original green film branding, restrained light type, and near-black surfaces to frame actual TMDB artwork. An edge-to-edge landscape introduces the library. Poster rails, more compact catalogue grids, and landscape episode rows give artwork different roles. Keep green for brand, focus and decisive actions. Most panels and navigation stay quiet. MovieExplorer is a discovery and metadata application. Details actions open title information.

## Tokens and typography

| Role | Value |
|---|---|
| Canvas and fallback edge | `#080B11` |
| Header, footer | `#0B1019`, `#0A0F18` |
| Surface, elevated surface, border | `#0F1520`, `#171F2D`, `#293648` |
| Primary, secondary and muted text | `#F8FAFC`, `#ACB9CB`, `#8D9CB1` |
| Green accent, action foreground | `#4ADE80`, `#082015` |
| Rating and selected heart | `#F4CC80`, `#FF8298` |

[Global CSS](src/assets/main.css) holds the tokens and shared styles. Type uses locally available Inter, Segoe UI, or the system sans-serif. There is no font download. Hero title sizes are fluid and tightly tracked. Section titles, body copy, and metadata use progressively smaller type. The green uppercase kicker identifies feature or detail context. Overview text has comfortable line height and constrained measure. The original favicon remains, and title and description continue to cover movie and TV discovery.

## Shell and header

[App.vue](src/App.vue) retains one growing main landmark inside a viewport-height flex shell. The footer follows content on tall pages and sits low on short ones. The 90 rem shared frame has fluid horizontal gutters from 1 to 4 rem. Hero artwork breaks out to full main width while ordinary content aligns to the frame.

[AppHeader](src/components/AppHeader.vue) combines the MovieExplorer mark, four primary sections, and compact [TitleSearch](src/components/TitleSearch.vue). A green underline indicates the section, including TV and movie detail descendants. At 850 px and below, navigation uses its own row. At 599 px and below, search uses a full-width third row. The footer displays the product and developer credits. The Library displays the TMDB logo and non-endorsement notice, and Where to Watch credits JustWatch.

## Home and rails

[CinemaHomeView](src/views/CinemaHomeView.vue) selects up to five real movie and TV candidates with eligible landscape images from the two Trending responses. The cover uses a dark directional gradient, release or first-air year, rating when meaningful, overview, Explore details and a Favorite toggle. Prev, Next, indicators and Pause/Resume support manual use. Arrow keys work within the controls. Rotation interval is 14 seconds and pauses during hover, focus, explicit pause, hidden documents, and reduced motion. Text remains visible over fallback gradients if artwork is missing. An initial skeleton covers pending data.

The prominent global search precedes [CinemaRail](src/components/CinemaRail.vue) sections for Trending Movies and TV Series, Popular Movies and TV Series, Top Rated Movies and TV Series, Coming Soon and On the Air. Each has a direct View all link. Top Rated Movies uses a six-title responsive grid for variety. The other sections scroll horizontally using keyboard, touch, or controls. They show about six cards at 1100 px and above, five down to 851 px, four down to 600 px, and part of a third on compact screens. See the architecture reference for request priority and limits.

## Cards, catalogues and collections

[MovieCard](src/components/MovieCard.vue) is the shared movie and TV presentation. A single link includes its clipped 2:3 poster and title, while [FavoriteButton](src/components/FavoriteButton.vue) is a separately focusable sibling on top of the artwork. Context metadata shows year, media type for mixed results, and a gold rating when data supports it. Phase 8B lifts and scales the tile itself on hover or keyboard focus, with a smaller rail variant and unchanged layout geometry.

[MovieCardSkeleton](src/components/MovieCardSkeleton.vue) reserves artwork and metadata space. The shared catalogue grid uses 2 columns below 640 px, then 3, 4, 5 and 6 at 640, 768, 1024 and 1536 px. Movie and TV catalogues use dark category tabs, compact common filters, collapsible advanced filtering with existing Apply and Reset actions, removable active filters, and [CataloguePagination](src/components/CataloguePagination.vue) with accessible current-page styling and a jump form. Search reuses the card grid, mixed-media labels and a media-type selector. Your Favorites retains the media selector and storage warning while offering both movie and TV entry points in empty states.

## Detail pages

[MediaDetailHero](src/components/MediaDetailHero.vue) uses [CinemaArtwork](src/components/CinemaArtwork.vue) behind a foreground poster or landscape still, title and compact metadata. Movie and series backgrounds use their own backdrops. Season introductions use the parent series backdrop when available. Episode details use a landscape still. The shared composition adapts from side by side to stacked on compact screens.

Movie details include an overview, release and runtime information, cast and a Favorite action. Series details retain statistics, credits and all seasons. The season gallery includes Specials and uses poster, title and compact season metadata. Season pages present every available episode in separated landscape rows. Episode artwork and titles link to episode details. Season and episode navigation reflect actual neighbor numbers. There are no playback controls.

## Artwork, motion and feedback

- [MediaPoster](src/components/MediaPoster.vue) keeps posters at 2:3 and stills at 16:9. TMDB poster candidates are w185, w342, w500 and w780. Still candidates are w185 and w300. The backdrop uses w780 and w1280. Primary artwork loads eagerly. Lower posters and stills use native lazy loading. Paths are validated and failed artwork switches to a local fallback without a retry loop.
- CSS uses short 160–240 ms control and poster transitions, a 270 ms route entrance, a 480 ms hero-copy entrance, an 850 ms backdrop dissolve, and restrained 14-second artwork movement. Skeletons use a 2.3-second shimmer during pending data. Reduced motion removes zoom, rotation and perceptible animation delays. Feedback remains immediately available.
- [DetailSkeleton](src/components/DetailSkeleton.vue) reflects the selected detail artwork ratio. [ContentState](src/components/ContentState.vue) handles empty, missing and failed data in the same dark system. Retry remains subject to the request lifecycle and Retry-After. Decorative backgrounds are hidden from screen readers. Keyboard focus, skip link, loading announcements, 44 px primary controls and accessible names are shared patterns.

## History and future work

Phase 5 established the full-height shell and shared poster and grid geometry. Phases 6 and 7 added catalogue and TV browsing while still using the earlier light canvas. Phase 8 replaces that canvas and preserves their data contracts. Phase 4C’s broader movie reliability work, Phase 4D and Phase 4E remain deferred. Phase 9 adds advanced discovery when approved. Phase 10 covers comprehensive verification and owner deployment.

## Phase 8B dual themes and interaction

The pre-paint script [theme-preference.js](public/theme-preference.js) resolves `movieExplorer.theme` on the document element and applies dark by default. The header [ThemeToggle](src/components/ThemeToggle.vue) uses the same preference owner. A storage failure retains the current tab's choice. Native form color-scheme follows the root. Desktop places the control beside search. Mobile places it in the brand row.

| Semantic role | Dark | Light |
|---|---|---|
| Canvas, surface, elevated | #080B11, #0F1520, #171F2D | #F5F7F9, #FFFFFF, #EDF2F7 |
| Header / footer | #0B1019 / #0A0F18 | #FFFFFF / #E9EFF3 |
| Main / secondary / muted text | #F8FAFC / #ACB9CB / #8D9CB1 | #111827 / #334155 / #526278 |
| Accent / action foreground | #4ADE80 / #082015 | #146B3A / #FFFFFF |
| Decorative / control border | #293648 / #66758A | #D7E0E9 / #74859A |
| Active surface / foreground | #183326 / #8AF0AD | #E0F3E6 / #155C35 |
| Rating / selected favorite | #F4CC80 / #FF8298 | #78510A / #AA2845 |
| Error / warning | #FDA4AF / #F5D290 | #9F243C / #704B10 |
| Focus / scrollbar | #4ADE80 / #52647C | #176A3D / #77889A |
| Skeleton / shimmer | #151E2A / #FFFFFF14 | #E2E9F0 / #FFFFFFB0 |

The `.on-art` scope retains near-black scrims, light text, green and gold accents and a dark heart overlay in both themes. The artwork edge blends into the selected canvas. Poster fallbacks remain artwork surfaces. Light native controls use their own darkened chevron and contrast colors.

Catalogue and season tiles lift 5 px and scale to 1.055 over 280 ms. Rail tiles lift 3 px and scale to 1.032, with internal clearance, shadow and focus outlines. Pointer lift requires a fine hover device. Keyboard focus provides equivalent emphasis. Reduced motion preserves static shadows and focus. Native scrollbars retain a subdued default thumb and become clearer on interaction. Rail arrows disable at both boundaries and reserve their space when hidden. Hearts animate on adding a favorite, with a 280 ms peak at 1.2. Rail results and detail copy enter once over 380 ms. Existing 270 ms route entrance, 480 ms featured story, 850 ms dissolve, 14-second featured motion and 2.3-second skeleton remain.

Home chooses up to five unique movie and TV titles, preferring useful copy and filling from either feed. Rotation pauses offscreen, while interacting, while the document is hidden, and when a trailer is open. Manual slide changes are announced. Wide or high-density featured images can use the TMDB original candidate, and ordinary backdrops stay at w780/w1280. Only the current featured title selects the original variant. Rail poster sizes reflect rail widths. Episode heroes prefer the parent series backdrop while retaining the actual still in front. Portrait credits use responsive w45/w185 profiles, lazy loading and placeholders.

Movie and TV title pages share [CastGallery](src/components/CastGallery.vue) and existing credits. TV identifies latest-season cast. Episode detail includes guest roles and crew. The season gallery shares the artwork lift, and episode rows provide one scoped link per episode. [TrailerExperience](src/components/TrailerExperience.vue) mounts outside the artwork and rails, with a themed shell, dark viewport, explicit provider disclosure and native YouTube controls.

## Permanent design freeze

The v1.0.0 verification phase preserves the existing visual tokens, spacing, layout, themes and motion. Missing movie metadata uses the existing conditional rendering and artwork fallback.

The owner froze the Phase 8B cinematic design. Changes to existing visual tokens, layouts, motion, responsive behavior, or branding require explicit owner approval. Phase 9 features use the existing detail hero, profile artwork, poster grid, rails, content states, buttons and theme styles. New controls for playback, discovery and the Library follow those conventions.
