# MovieExplorer architecture

**Baseline version 2 · 2026-11-26 · Movie-only application after local Phase 3A/3B implementation**

This reference describes what is implemented in the local source. Production observations are from the preceding read-only audit. Future architecture is recorded separately below. See [Design system](DESIGN_SYSTEM.md) for visual specifications and [Agent instructions](AGENTS.md) for workflow and preservation rules.

## Purpose and stack

MovieExplorer is a client-rendered Vue SPA for discovering movies, searching titles, inspecting movie details, and storing favorites in a browser. It has three app routes. Same-origin movie metadata requests go through a Vercel-compatible function, while browsers load posters directly from the TMDB image CDN. There is no user account system, database, or TV functionality.

Versions below are resolved direct dependencies in [package-lock.json](package-lock.json), whose lockfile version is 3. Manifest ranges are in [package.json](package.json). These versions do not establish the full production dependency graph.

| Dependency | Locked version | Responsibility |
|---|---:|---|
| Vue | 3.5.22 | Single-file components, Composition API and rendering |
| Vue Router | 4.6.3 | HTML5 history, routes and links |
| Pinia | 3.0.3 | Shared search and favorites state |
| Axios | 1.12.2 | Declared runtime dependency. Application HTTP uses native Fetch. |
| Vite | 7.1.11 | Dev server and production bundling |
| @vitejs/plugin-vue | 6.0.1 | Vue SFC compilation |
| vite-plugin-vue-devtools | 8.0.3 | DevTools integration |
| Tailwind CSS | 3.4.18 | Active CSS generator |
| @tailwindcss/forms | 0.5.10 | Active form styling plugin |
| @tailwindcss/postcss | 4.1.15 | Inactive Tailwind 4 integration |
| @tailwindcss/vite | 4.1.15 | Inactive Tailwind 4 integration |
| PostCSS | 8.5.6 | CSS processing |
| Autoprefixer | 10.4.21 | CSS vendor prefixes |
| gh-pages | 6.3.0 | GitHub Pages publishing script |

The project uses JavaScript ES modules. Node engine is `^20.19.0 || >=22.12.0`. The built-in Node test runner covers movie API, client contracts and rewrite scope with mocked requests. No npm version, linting, formatting, automated type checking, or local CI workflow is configured. SVG icons are inline. Native browser APIs provide Fetch, history, and storage.

## Repository map and responsibilities

Generated output, dependencies, and repository internals are omitted.

```text
.
├─ .env.example
├─ .env.local (private, if present)
├─ .gitignore
├─ .vscode/extensions.json
├─ AGENTS.md
├─ ARCHITECTURE.md
├─ DESIGN_SYSTEM.md
├─ README.md
├─ index.html
├─ jsconfig.json
├─ package.json
├─ package-lock.json
├─ postcss.config.js
├─ tailwind.config.js
├─ vite.config.js
├─ vercel.json
├─ api/movies.js
├─ server/
│  ├─ movies.js
│  └─ vite-movie-api.js
├─ test/
│  ├─ frontend-api-routing.test.js
│  └─ movies-api.test.js
├─ public/favicon.ico
└─ src/
   ├─ App.vue
   ├─ main.js
   ├─ assets/main.css
   ├─ components/
   │  ├─ AppFooter.vue
   │  ├─ AppHeader.vue
   │  └─ MovieCard.vue
   ├─ router/index.js
   ├─ services/moviesApi.js
   ├─ stores/
   │  ├─ favoritesStore.js
   │  └─ searchStore.js
   └─ views/
      ├─ FavoritesView.vue
      ├─ HomeView.vue
      ├─ MovieDetailView.vue
      └─ testView.vue
```

| Path | Responsibility and consumers |
|---|---|
| [index.html](index.html) and [public/favicon.ico](public/favicon.ico) | HTML shell, root mount target, viewport, and favicon. Title is the starter “Vite App” and HTML language is empty. |
| [src/main.js](src/main.js) | Creates the Vue app, imports CSS, installs Pinia then router, and mounts to `#app`. |
| [src/App.vue](src/App.vue) | Shared header, routed main area and footer. Imports the shell components. |
| [src/assets/main.css](src/assets/main.css) | Tailwind base, components and utilities. Imported once in `main.js`. |
| [src/components/AppHeader.vue](src/components/AppHeader.vue) | Persistent navigation and search query input. Uses RouterLink and the search store. |
| [src/components/AppFooter.vue](src/components/AppFooter.vue) | Static author, technology and TMDB credits. |
| [src/components/MovieCard.vue](src/components/MovieCard.vue) | Reused by Home and Favorites. Requires a `movie` object prop, links to details and calls favorites actions. |
| [src/router/index.js](src/router/index.js) | Route definitions and HTML5 history. Used by bootstrap. |
| [src/services/moviesApi.js](src/services/moviesApi.js) | Same-origin Fetch wrappers for the movie function. Retains the arrays/object and empty/null contracts and the unused Popular helper. |
| [src/stores/searchStore.js](src/stores/searchStore.js) | Shared in-memory query. Header writes and Home reads. |
| [src/stores/favoritesStore.js](src/stores/favoritesStore.js) | Shared snapshots and localStorage persistence. Used by MovieCard and FavoritesView. |
| [src/views/HomeView.vue](src/views/HomeView.vue) | Owns results, genres, filters, and request lifecycle. Renders MovieCard. |
| [src/views/FavoritesView.vue](src/views/FavoritesView.vue) | Lazy route rendering saved snapshots and an empty state. Renders MovieCard. |
| [src/views/MovieDetailView.vue](src/views/MovieDetailView.vue) | Fetches details and appended credits for the ID captured on mount. Displays details and history Back. |
| [src/views/testView.vue](src/views/testView.vue) | Unrouted detail prototype. It has no test runner or assertions. |
| [vite.config.js](vite.config.js) and [jsconfig.json](jsconfig.json) | Vite enables Vue and DevTools and maps `@` to `src`. JS configuration mirrors alias for tooling and excludes generated directories. |
| [postcss.config.js](postcss.config.js), [tailwind.config.js](tailwind.config.js) | PostCSS loads Tailwind 3 and Autoprefixer. Tailwind scans HTML and source, enables forms, and extends no theme tokens. |
| [.gitignore](.gitignore), [.env.example](.env.example) | Ignore rules cover private env files and Vercel local settings. The template names the server variable only. |
| [api/movies.js](api/movies.js), [server/movies.js](server/movies.js) | Vercel Web handler and shared server-only dispatcher for validated, authenticated TMDB requests. |
| [server/vite-movie-api.js](server/vite-movie-api.js) | Local Vite dev/preview adapter. Uses the same handler as Vercel. |
| [vercel.json](vercel.json) | Scoped SPA rewrites for the two existing deep-link paths. |
| [test/](test) | Node tests for API validation, responses, frontend contracts and rewrite scope. |
| [package.json](package.json) and [package-lock.json](package-lock.json) | Package metadata, scripts, direct dependencies, and resolved npm dependency tree. |
| [.vscode/extensions.json](.vscode/extensions.json) and [README.md](README.md) | Vue editor recommendation and project setup, verification and deployment instructions. |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [AGENTS.md](AGENTS.md) | Visual baseline and repository rules. |

## Initialization and data flow

```text
index.html -> main.js (CSS + Vue + Pinia + Router) -> App.vue
  persistent AppHeader -> Pinia searchQuery ----+
  main -> RouterView                           |
    HomeView <---------------------------------+
      local filters -> moviesApi -> /api/movies -> TMDB Discover / Search / Genres
      results -> MovieCard -> image CDN / movie route / Pinia favorites
    FavoritesView (lazy) <- Pinia favorites <-> localStorage favoritesList
      snapshots -> MovieCard
    MovieDetailView -> moviesApi -> /api/movies -> TMDB detail + appended credits
      poster -> image CDN
  persistent AppFooter
```

1. The index document loads the module entry. The bootstrap installs plugins before mounting to `#app`.
2. The shell renders the header and footer around the route outlet. The header's `v-model` updates the Pinia query.
3. Home's immediate `watchEffect` starts Discover on a fresh load. A nonempty query in the running SPA makes it start Search instead. The genre request starts separately on mount and does not block cards.
4. A list response replaces the current `movies` ref. The view renders every returned entry as a MovieCard keyed by movie ID. Card images are then fetched directly by the browser.
5. The favorites store initializes from local storage when first consumed. Every card reads shared membership and calls the store directly. Favorites renders the same card from a stored snapshot.
6. Details fetches independently using the mounted route ID. It does not reuse Home or Favorites objects or its own previous responses.

The app has no custom composables, component event declarations, shared request cache, or normalized entity store. Vue props, Pinia, route state, and native DOM handlers are the communication boundaries. Search state is shared, but the results and filters live only in Home.

## Routes and navigation

[Router source](src/router/index.js) lines 6–26 uses `createWebHistory(import.meta.env.BASE_URL)`.

| Path | Route name | View | Loading and input |
|---|---|---|---|
| `/` | `home` | HomeView | Eager. No route input. |
| `/favorites` | `favorites` | FavoritesView | Lazy dynamic import. |
| `/movie/:id` | `movie-details` | MovieDetailView | Eager. Required ID without numeric validation. |

The Home link and wordmark target Home. Favorites targets its named route. The card Details anchor passes `movie.id`. Search is visible globally but does not navigate. Only Home fetches search results. There are no route guards, search/filter query parameters, custom scroll restoration, catch-all, or nested routes. Browser Back/Forward changes routes without reconstructing Home's filter state. Pinia query survives in-app route changes but is reset by a new application instance. Detail Back delegates to browser history and is shown once details load. Same-component route ID changes can retain an older movie because the ID is captured once and there is no watcher. Direct navigation and new-tab behavior also depend on the server fallback described under deployment.

## TMDB integration and request behavior

`Browser → GET /api/movies → Vercel Function → TMDB v3`.

[Frontend service](src/services/moviesApi.js) exposes the same five functions. [Vercel entry](api/movies.js) passes requests to the [shared handler](server/movies.js). Authentication uses server-only `TMDB_API_KEY` and the TMDB v3 `api_key` parameter on the upstream HTTPS request. The browser sees neither the credential nor the authenticated URL. Vite `envPrefix: []` limits client environment exposure to its built-ins, including `BASE_URL`. The local adapter loads `TMDB_API_KEY` on the server for dev and preview.

All operations use `GET /api/movies?operation=...`. The upstream origin is fixed at `https://api.themoviedb.org/3`. The handler sets its own `Accept: application/json` and refuses redirects. It forwards no caller headers or authentication.

| Operation | Public parameters beyond `operation` | Fixed upstream behavior | Client contract |
|---|---|---|---|
| `discover` | Optional `genre`, `year` | `/discover/movie`, `language=en-US`, `page=1`, `sort_by=popularity.desc`, `include_adult=false`. Maps to `with_genres` and `primary_release_year`. | `discoverMovies(filters)` returns `results` or `[]`. |
| `search` | Required `query` | `/search/movie`, `language=en-US`, `page=1`, `include_adult=false`; query encoded safely. | `searchMovies(query)` returns `results` or `[]`. |
| `genres` | None | `/genre/movie/list`, `language=en`. | `fetchGenres()` returns `genres` or `[]`. |
| `popular` | None | `/movie/popular`, `language=en-US`, `page=1`. | `fetchPopularMovies()` returns `results` or `[]`. Still unused by the UI. |
| `details` | Required `id` | `/movie/{id}`, `language=en-US`, fixed `append_to_response=credits`. | `fetchMovieById(id)` returns the movie object with credits or `null`. |

Requests must have a known operation and only its eligible parameters. Duplicate keys, malformed escapes/UTF-8, or request URLs over 4,096 characters are rejected. IDs and genre IDs use canonical positive decimal integers up to 2,147,483,647. A year must be a four-digit integer from 1000 through 9999. Searches must have 1–160 Unicode code points after trimming, with no control characters. Callers cannot supply a destination, arbitrary append, page, locale, headers, or authentication.

Valid upstream response envelopes are preserved, including list pagination metadata when supplied. The handler checks the object and list shapes used by the client, including detail ID, rating and appended cast. It rejects invalid JSON, unexpected data, and responses reflecting the exact key. A single eight-second deadline covers upstream fetch and body reading. No automatic retries occur. Errors are JSON `{ error: { code, message } }` and exclude raw upstream text, URLs and headers. A safe numeric or canonical HTTP-date `Retry-After` may be passed through for 429 or 503.

| Status | Meaning |
|---|---|
| 400 | Missing, invalid, duplicate or unexpected parameters |
| 404 | Unknown operation or confirmed missing movie detail |
| 405 | Unsupported method, with `Allow: GET` |
| 429 | Upstream rate limit |
| 500 | Unexpected server failure |
| 502 | Upstream auth rejection, network failure, invalid payload or other upstream error |
| 503 | Missing server configuration or upstream service unavailable |
| 504 | Upstream request/body timeout |

All responses use `Cache-Control: no-store`. Genre lists, Popular and default Discover are candidates for short shared caching after provider requirements and usage are reviewed. Search, filters and details have higher query cardinality. There is no in-memory cache or rate limiter. Validation, one upstream request per operation and the timeout limit work per request. The API remains public, so masking the key does not prevent repeated valid calls or function usage. Consider platform rate limiting and metrics if abuse or cost demands it.

### Existing UI behavior

Home still runs popularity-sorted Discover for its “Popular Movies” list. Genre and year are passed together when present. The year input can still issue requests for partial input; the server rejects those without contacting TMDB. Genre/search are remote and the filters are ignored while searching. Clearing search reactivates existing filters on the same mount. Navigating away discards Home's local state.

Only page 1 is requested. The browser still uses only the result array. Filters and search query different subsets of TMDB, but later pages remain unavailable in the interface. The provider's valid page range is a per-query constraint and not a count of catalogue titles. [TMDB error reference](https://developer.themoviedb.org/docs/errors)

Home's `isLoading` is assigned but the template checks `movies.length === 0`. Details uses a null test. Empty or failed responses can appear to load indefinitely. Prior cards remain visible during a new list request and older responses can overwrite newer results. The UI still has no debounce, cancellation, independent error presentation or result deduplication.

Posters continue to use the `https://image.tmdb.org/t/p/w500` prefix and `poster_path`. See [Design system](DESIGN_SYSTEM.md#image-system).

## Current data contracts

Fields below describe shapes the app receives or reads. The app does not enforce a runtime schema.

| Contract | Current shape and usage |
|---|---|
| Movie summary | Raw TMDB result with numeric `id`, `title`, `release_date` and `poster_path` consumed directly by cards. Results can also contain `original_title`, `original_language`, `genre_ids`, `overview`, `backdrop_path`, `popularity`, `vote_average`, `vote_count`, `adult` and `video`. There is no added media type or normalization. |
| Movie detail | Raw object, initially `null`. Reads `title`, `poster_path`, `tagline`, `overview`, `release_date`, `runtime`, `vote_average`, `vote_count` and `credits.cast`. Other base fields such as original title, genres, backdrop, production and financial metadata are unused. |
| Genres | Array of `{ id, name }` from TMDB. Local Home state starts empty and populates the selector. Detail genre objects are unused. |
| Credits | Appended `credits` object can contain `cast` and `crew`. The template reads `cast.slice(0, 5)` and actor `id` and `name`. Crew and other cast properties do not render. |
| Favorites | `favoritesList` in localStorage holds a JSON array of entire movie snapshots passed by MovieCard. Cards use the same title/date/poster fields as Home. There is no schema version, media type, or refresh. |
| Search state | Pinia `search` store has reactive string `searchQuery`, initially empty, with no actions/getters or persistence. |
| Home state | Vue refs `movies = []`, `genres = []`, `selectedGenre = ''`, `selectedYear = ''`, and `isLoading = false`. Bound genre values are numeric IDs or empty. Year uses Vue numeric input conversion and may be empty. These refs are recreated on Home remount. |

[Favorites store](src/stores/favoritesStore.js) lines 9–47 parses `favoritesList` without a guard. `toggleFavorite(movie)` finds the first strict ID match, adds or removes the snapshot, and serializes the whole array. `checkIsFavorite(movieId)` uses `.some()`. This avoids duplicates for ordinary well-formed movie records. Storage survives refresh and browser reopening on the same origin if available. There is no cross-tab listener, account sync, sessionStorage, IndexedDB, or backend storage. Malformed JSON, unexpected types and storage failures are unhandled.

Numeric IDs are scoped to the media entity. A future movie and series with the same ID must coexist in favorites and list rendering. Composite identities such as `movie:123` and `tv:123` are proposed. Legacy entries have no type and should be treated as movies, validated, kept in order, and migrated without discarding original snapshots on a failed write.

## Build, hosting and security

- **Repository** [wanjugi/Movie-Explorer](https://github.com/wanjugi/Movie-Explorer)
- **Public production** [MovieExplorer on Vercel](https://movie-explorer-nine-gilt.vercel.app/)
- **Scripts** `npm run dev` runs Vite with the local API middleware. `npm run build` writes default client output to `dist/`. `npm run preview` serves the built frontend and the same local API. The existing `npm run deploy` script builds and publishes to GitHub Pages, which cannot host this server API.
- **Local environment** The Vite adapter reads `TMDB_API_KEY` from the server process or Vite's private mode env files. No credential is needed for the frontend build or mocked tests. Windows commands and owner steps are in [README.md](README.md).
- **Vercel configuration** Use the Vite preset, a compatible Node runtime, `dist` output and a private `TMDB_API_KEY` in the intended environments. The function is discovered at `api/movies.js`, with its shared code outside the client and API route tree.
- **Routing precedence** Vue Router retains `createWebHistory` and the default root base. [vercel.json](vercel.json) rewrites only `/favorites` and `/movie/:id` to `/index.html`. The root uses the regular index. The rules do not match `/api`, unknown API paths, `/assets`, or `/favicon.ico`. Unknown app paths outside those rules receive the platform 404. Paths matching a movie route receive the SPA document, even if the movie ID is invalid or the API later returns 404. No client-side not-found view was added. [Vercel Vite routing](https://vercel.com/docs/frameworks/frontend/vite)
- **Known local differences** Vite supplies its own app HTML fallback. The local API middleware intercepts `/api` before it, returning JSON 404 for unrecognized API paths. Vite dev/preview do not execute Vercel rewrite rules. The rewrite config and local HTTP behavior can be tested locally. Vercel packaging and HTTP results need an owner-deployed preview or production instance.
- **Previous production audit** Root returned 200 and direct `/favorites` and `/movie/550` returned 404 without a SPA fallback. The public JS contained the old configured key. Implementing new source does not remove or revoke a public key from the existing deployment. Perform the owner cutover and replacement steps in the README.
- **Unverified** Dashboard settings, environment scopes, the deployed source revision and post-release behavior. Existing metadata remains sparse and there is no SSR or prerender setup.

## Technical debt register

| ID | Classification | Evidence and impact | Relevant source |
|---|---|---|---|
| T01 | Confirmed historical production exposure | New source holds auth server-side. Existing deployed assets and credential remain exposed until the owner deploys and replaces/revokes the old key. | Current server handler and prior public build |
| T02 | Confirmed production defect before deployment | Versioned deep-link rewrites now exist locally. Actual Vercel behavior after deployment is unverified. | router lines 6–26 and vercel.json |
| T03 | Confirmed state defect | Empty and failed lists/details appear to be loading. Genre failures leave the default option alone. | Home lines 21–36,63–68, Detail lines 19–28, moviesApi |
| T04 | Confirmed UI request race | Parameters are now safely serialized. Overlapping effects can still commit responses out of order. | Home lines 21–36, frontend movie service |
| T05 | Confirmed navigation limitation | Search is global to edit and Home-only to view. A reused detail route does not fetch a changed ID. | AppHeader lines 25–33, Home lines 21–36, Detail lines 10–20 |
| T06 | Confirmed persistence limitation | Invalid local data or denied writes can fail. Stored snapshots can grow stale. TV ID collisions would arise with numeric-only identity. | favoritesStore lines 14–37 |
| T07 | Architectural limitation | One page per result, no cache or shared abuse quota, no UI request cancellation or deduplication. | Shared server handler and Home effect |
| T08 | Maintenance issue | Repeated poster construction, unused Popular wrapper, prototype, unused store import/helper, Axios and inactive Tailwind 4 adapters. | MovieCard, MovieDetailView, moviesApi, testView, favoritesStore, package.json |
| T09 | Partial quality infrastructure | Focused Node API tests exist. Component/browser suites, type/lint/format scripts and local CI remain absent. | test/ and package.json |
| T10 | Confirmed input/data gaps | Incomplete year edits can fetch. Null or malformed data can break details rating or cast and produce broken image URLs. | Home lines 56–59, Detail lines 33–75, moviesApi |
| T11 | Security hygiene | Private env files are now covered by ignore rules. Existing tracking and history remain unverified. | .gitignore |
| T12 | Missing features | TV browsing/details, seasons, episodes, mixed search, advanced filters, later list pages, and route metadata are absent. | router, moviesApi, Home and Details |
| T13 | Unverified runtime risks | Potential breakpoint overflow, browser-specific storage behavior, dependency advisory coverage and live TMDB rate limits were not exercised. | [Design defects](DESIGN_SYSTEM.md#known-visual-defects-and-candidate-fixes), package-lock, platform |
| T14 | Confirmed layout and accessibility gaps | Non-growing main displaces the short-page footer. Nested landmarks, contrast and visible focus gaps remain. | App, routed views, header and card. See [Design system](DESIGN_SYSTEM.md). |

## Proposed architecture for later phases

The following options are pending later implementation phases.

1. **Keep Vue, Vite, Tailwind and Pinia.** Improve the existing layers incrementally. JS can remain viable with runtime validation and checked contracts. Consider JSDoc or TypeScript at media, request and persistence boundaries if complexity warrants it.
2. **Build on the small movie function.** Verify packaging and rewrites on Vercel after deployment. Consider bounded caching and platform request limits if usage warrants them, and complete the credential cutover.
3. **Improve the UI request lifecycle.** Build on validated responses and retained pagination metadata. Add cancellation or last-request-wins and independent pending, success, empty and error states. Discover across categories and pages without acquiring the entire catalogue in browser memory.
4. **Separate summaries from detail contracts.** Shared summaries can provide `mediaType`, source ID, display title/date, poster and rating. Map movie `title` and `release_date` and TV `name` and `first_air_date` intentionally. Keep movie runtime, TV season structures and episode details distinct. Any people search results need their own presentation contract.
5. **Keep existing movie URLs and share new resource routes.** Preserve `/movie/:id`. Candidate routes include `/tv/:id`, `/tv/:id/season/:seasonNumber` and `/tv/:id/season/:seasonNumber/episode/:episodeNumber`. Validate resource parameters, including valid season zero when applicable. Consider route query state for shareable search, filters and pages.
6. **Migrate favorites safely.** Introduce composite media identity, preserve existing movie order and useful display data, validate legacy entries and make migration retry-safe. Keep raw legacy data recoverable until a new write succeeds. Add accounts or database infrastructure only when explicitly approved requirements justify it.
7. **Expand automated regression coverage.** The current Node tests cover API behavior and routing config. Add UI response-state and race tests, checks for parameter changes and deployed direct routes, and future favorite identity, persistence and responsive accessibility checks.

### Owner’s planned design direction

The owner prefers a cinematic dark homepage with green branding and dividers, minimalist poster-focused cards, rounded consistently sized posters, titles and release years, and prominent search. Separate movie and TV sections with View all links and discovery categories are future concepts. The current appearance remains documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). The owner will approve visual changes in a later phase.
