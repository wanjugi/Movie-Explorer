# MovieExplorer architecture

**Baseline version 4 · 2026-11-26 · Movie-only application after Phase 4A/4B**

This reference describes the local source. Production observations distinguish previous audit results and owner-confirmed Phase 3D verification. Future architecture is recorded separately below. See [Design system](DESIGN_SYSTEM.md) for visual specifications and [Agent instructions](AGENTS.md) for workflow and preservation rules.

## Purpose and stack

MovieExplorer is a client-rendered Vue SPA for discovering movies, searching titles, inspecting movie details, and storing favorites in a browser. It has three app routes. Same-origin movie metadata requests go through a Vercel-compatible function, while browsers load posters directly from the TMDB image CDN. There is no user account system, database, or TV functionality.

Versions below are resolved direct dependencies in [package-lock.json](package-lock.json), whose lockfile version is 3. Manifest ranges are in [package.json](package.json). These versions do not establish the full production dependency graph.

| Dependency | Locked version | Responsibility |
|---|---:|---|
| Vue | 3.5.46 | Single-file components, Composition API and rendering |
| Vue Router | 4.6.3 | HTML5 history, routes and links |
| Pinia | 3.0.3 | Shared search and favorites state |
| Vite | 7.3.8 | Dev server and production bundling |
| @vitejs/plugin-vue | 6.0.1 | Vue SFC compilation |
| vite-plugin-vue-devtools | 8.0.3 | DevTools integration |
| Tailwind CSS | 3.4.18 | Active CSS generator |
| @tailwindcss/forms | 0.5.10 | Active form styling plugin |
| PostCSS | 8.5.33 | CSS processing |
| Autoprefixer | 10.4.21 | CSS vendor prefixes |
| gh-pages | 6.3.0 | GitHub Pages publishing script |

The project uses JavaScript ES modules. The Node engine remains `^20.19.0 || >=22.12.0`. Phase 3C verification ran on Node 22.23.5 and npm 11.4.1. No npm version, linting, formatting, automated type checking, or local CI workflow is configured. SVG icons are inline. Native browser APIs provide Fetch, history, and storage.

### Phase 3C dependency maintenance

- Removed Axios 1.12.2 because both client and server use native Fetch. Removed the two Tailwind 4 adapters at 4.1.15. Tailwind 3 continues to run through PostCSS and the forms plugin.
- Updated Vue 3.5.22 to 3.5.46, Vite 7.1.11 to 7.3.8, and PostCSS 8.5.6 to 8.5.33 to address current audit findings within the existing majors. Vue's audit finding came from the bundled dependency on its server renderer. MovieExplorer is a client-rendered SPA. Vite and PostCSS findings chiefly affected development/build tooling.
- Updated affected transitives within existing ranges, including Rollup, Babel, Picomatch, Nano ID, selector parsing, and source-map dependencies. Sucrase 3.35.1 removed the remaining audited glob/minimatch chain from Tailwind 3.
- Refreshed Browserslist 4.29.6, `baseline-browser-mapping` 2.11.39, and `caniuse-lite` 1.0.30001828. The official Browserslist updater confirmed the current database version. The compatibility warnings disappeared in a dev CSS request and the final build. The generated CSS matched the pre-maintenance build byte for byte.
- The full npm audit fell from 18 affected packages to zero. The final production-only audit also reported zero. This is a registry snapshot. Recheck both before future maintenance releases.
- Kept the SFC and DevTools plugins active, along with Vue Router, Pinia, Tailwind 3, the forms plugin, and Autoprefixer. The legacy `gh-pages` dependency and `deploy` script remain pending owner confirmation about any external GitHub Pages use.

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
│  ├─ latest-request.test.js
│  ├─ movie-browse.test.js
│  ├─ movies-api.test.js
│  └─ vite-api.test.js
├─ public/favicon.ico
└─ src/
   ├─ App.vue
   ├─ main.js
   ├─ assets/main.css
   ├─ components/
   │  ├─ AppFooter.vue
   │  ├─ AppHeader.vue
   │  └─ MovieCard.vue
   ├─ composables/{useLatestRequest,useMovieBrowseControls,useMovieBrowseResults}.js
   ├─ router/{index,movieBrowseQuery}.js
   ├─ services/moviesApi.js
   ├─ stores/favoritesStore.js
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
| [src/components/AppHeader.vue](src/components/AppHeader.vue) | Persistent navigation and search form. Edits a local draft and commits through Vue Router. |
| [src/components/AppFooter.vue](src/components/AppFooter.vue) | Static author, technology and TMDB credits. |
| [src/components/MovieCard.vue](src/components/MovieCard.vue) | Reused by Home and Favorites. Requires a `movie` object prop, links to details and calls favorites actions. |
| [src/router/index.js](src/router/index.js) | Route definitions and HTML5 history. Used by bootstrap. |
| [src/services/moviesApi.js](src/services/moviesApi.js) | Same-origin Fetch wrappers for the movie function. Returns validated arrays or a detail object. Supports opt-in normalized errors and cancellation, and retains default empty/null fallbacks. |
| [src/router/movieBrowseQuery.js](src/router/movieBrowseQuery.js) | Normalizes the three supported query keys and writes canonical Home URLs without equivalent navigation. |
| [src/composables/useMovieBrowseControls.js](src/composables/useMovieBrowseControls.js) | Owns temporary search/year drafts, debounce and navigation events. |
| [src/composables/useMovieBrowseResults.js](src/composables/useMovieBrowseResults.js) | Connects effective Home route state to separate movie and genre requests. |
| [src/composables/useLatestRequest.js](src/composables/useLatestRequest.js) | Owns cancellation, response ownership, state transitions and manual retry gating. |
| [src/stores/favoritesStore.js](src/stores/favoritesStore.js) | Shared snapshots and localStorage persistence. Used by MovieCard and FavoritesView. |
| [src/views/HomeView.vue](src/views/HomeView.vue) | Displays filters, request states and MovieCard. Uses the browse and request composables. |
| [src/views/FavoritesView.vue](src/views/FavoritesView.vue) | Lazy route rendering saved snapshots and an empty state. Renders MovieCard. |
| [src/views/MovieDetailView.vue](src/views/MovieDetailView.vue) | Fetches details and appended credits for the ID captured on mount. Displays details and history Back. |
| [src/views/testView.vue](src/views/testView.vue) | Unrouted detail prototype. It has no test runner or assertions. |
| [vite.config.js](vite.config.js) and [jsconfig.json](jsconfig.json) | Vite enables Vue and DevTools and maps `@` to `src`. JS configuration mirrors alias for tooling and excludes generated directories. |
| [postcss.config.js](postcss.config.js), [tailwind.config.js](tailwind.config.js) | PostCSS loads Tailwind 3 and Autoprefixer. Tailwind scans HTML and source, enables forms, and extends no theme tokens. |
| [.gitignore](.gitignore), [.env.example](.env.example) | Ignore rules cover private env files and Vercel local settings. The template names the server variable only. |
| [api/movies.js](api/movies.js), [server/movies.js](server/movies.js) | Vercel Web handler and shared server-only dispatcher for validated, authenticated TMDB requests. |
| [server/vite-movie-api.js](server/vite-movie-api.js) | Local Vite dev/preview adapter. Uses the same handler as Vercel. |
| [vercel.json](vercel.json) | Scoped SPA rewrites for the two existing deep-link paths. |
| [test/](test) | Built-in Node tests for API validation, frontend contracts, versioned rewrites and local Vite HTTP integration. |
| [package.json](package.json) and [package-lock.json](package-lock.json) | Package metadata, scripts, direct dependencies, and resolved npm dependency tree. |
| [.vscode/extensions.json](.vscode/extensions.json) and [README.md](README.md) | Vue editor recommendation and project setup, verification and deployment instructions. |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [AGENTS.md](AGENTS.md) | Visual baseline and repository rules. |

## Initialization and data flow

```text
index.html -> main.js (CSS + Vue + Pinia + Router) -> App.vue
  persistent AppHeader -> debounced draft -> router query
  main -> RouterView                         |
    HomeView <-------------------------------+
      filters -> router query -> latest request -> moviesApi -> /api/movies -> TMDB
      results -> MovieCard -> image CDN / movie route / Pinia favorites
    FavoritesView (lazy) <- Pinia favorites <-> localStorage favoritesList
      snapshots -> MovieCard
    MovieDetailView -> moviesApi -> /api/movies -> TMDB detail + appended credits
      poster -> image CDN
  persistent AppFooter
```

1. The index document loads the module entry. The bootstrap installs plugins before mounting to `#app`.
2. The shell renders the header and footer around the route outlet. The header synchronizes its input draft with the active route and commits valid searches through Vue Router.
3. Home's effective request key starts Discover for a blank query and Search for a valid title. Genres load separately in discovery and never gate movie results.
4. Only the active request may publish results or errors. Home renders returned results as MovieCards keyed by ID. Card images are fetched directly by the browser.
5. The favorites store initializes from local storage when first consumed. Every card reads shared membership and calls the store directly. Favorites renders the same card from a stored snapshot.
6. Details fetches independently using the mounted route ID. It does not reuse Home or Favorites objects or its own previous responses.

The route is the source of truth for committed search and filters. Pinia retains favorites only. The header draft and year draft represent uncommitted text. Request state is scoped to Home. There is no shared request cache or normalized entity store.

## Routes and navigation

[Router source](src/router/index.js) lines 6–26 uses `createWebHistory(import.meta.env.BASE_URL)`.

| Path | Route name | View | Loading and input |
|---|---|---|---|
| `/` | `home` | HomeView | Eager. Reads optional `q`, `genre`, and `year`. |
| `/favorites` | `favorites` | FavoritesView | Lazy dynamic import. |
| `/movie/:id` | `movie-details` | MovieDetailView | Eager. Required ID without numeric validation. |

The brand and Home links target unfiltered Home. Favorites and Details keep their existing paths. The header is global and sends a valid committed title from any app route to `/?q=...`. Details retains its history Back control and mount-only request. Same-component changes in the detail ID can still retain an older movie, which is deferred to Phase 4C.

### URL, input and history policy

- `q` is the trimmed title, limited to 160 Unicode code points without control characters. `genre` is a canonical positive integer up to 2,147,483,647. `year` is an integer string from 1000 through 9999. Vue Router encodes the URL and the Fetch service separately serializes allowed API parameters.
- Invalid values, duplicate query fields and unknown fields are ignored for requests. New URLs written by the controls contain only the valid nonempty state. A direct malformed URL can stay in the address bar until the user commits a different state.
- Home-origin searches retain valid `genre` and `year` in the URL as paused discovery filters. They are hidden during search and never sent to the Search endpoint. Clearing `q` restores them, including after refresh. A new search from a different route starts with no paused filters. Back returns to the prior route or filter state.
- Search debounces at 350 ms. Enter submits immediately. The first search or a different explicit Enter submission pushes history. A later debounced edit of an active search replaces that entry. Clearing active search pushes a discovery entry. Equivalent state causes no navigation or request. Navigation guards and scope disposal cancel pending draft timers.
- Year uses a numeric keyboard hint on a text field to preserve incomplete drafts without committing them. Four digits in range commit after 350 ms or Enter. Empty clears immediately. Selecting a genre can commit a valid pending year together. Independent filter changes push history.

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

### Frontend failures and request lifecycle

All five service functions accept optional `{ signal, throwOnError }` as their final argument. Valid responses preserve the previous arrays or detail object. With `throwOnError: true`, network failures, invalid responses, and HTTP errors produce a safe `MovieApiError` with a classification, HTTP status where available, retry eligibility, and a retry deadline where applicable. The client never displays upstream response text. The default still returns `[]` for list failures and `null` for detail failures. A supplied aborted signal is propagated as cancellation even in fallback mode.

Home uses the error-aware path. Its request key includes the normalized title in Search or genre and year in Discover. Changes irrelevant to that operation do not request results again. Each new load aborts its predecessor and takes ownership. The ownership check guards both results and errors even if an obsolete response arrives after abort. Route departure and scope teardown cancel active requests. This is browser-side cancellation. The server's existing eight-second upstream deadline still applies.

Home presents distinct idle, loading, populated success, empty success, and error states. It drops obsolete cards on a new committed request. Empty states offer clearing search or filters when applicable. Genres have a separate lifecycle and manual retry. Retry uses the last active operation and is available only after a retryable failure. Safe `Retry-After` on 429 or 503 disables retry until due. There is no automatic retry or polling. Details keeps its default fallback and existing view behavior until Phase 4C.

Movie lists remain first-page only. Discovery remains popularity-ranked. Posters use the existing `https://image.tmdb.org/t/p/w500` prefix and `poster_path`. See [Design system](DESIGN_SYSTEM.md#image-system).

## Current data contracts

Fields below describe the shapes the app receives or reads. The service validates the fields needed for successful list, genre and detail responses.

| Contract | Current shape and usage |
|---|---|
| Movie summary | Raw TMDB result with numeric `id`, `title`, `release_date` and `poster_path` consumed directly by cards. Results can also contain `original_title`, `original_language`, `genre_ids`, `overview`, `backdrop_path`, `popularity`, `vote_average`, `vote_count`, `adult` and `video`. There is no added media type or normalization. |
| Movie detail | Raw object, initially `null`. Reads `title`, `poster_path`, `tagline`, `overview`, `release_date`, `runtime`, `vote_average`, `vote_count` and `credits.cast`. Other base fields such as original title, genres, backdrop, production and financial metadata are unused. |
| Genres | Array of `{ id, name }` from TMDB. Local Home state starts empty and populates the selector. Detail genre objects are unused. |
| Credits | Appended `credits` object can contain `cast` and `crew`. The template reads `cast.slice(0, 5)` and actor `id` and `name`. Crew and other cast properties do not render. |
| Favorites | `favoritesList` in localStorage holds a JSON array of entire movie snapshots passed by MovieCard. Cards use the same title/date/poster fields as Home. There is no schema version, media type, or refresh. |
| Search and filter state | Home route query contains optional `q`, `genre`, `year`. Draft text stays in the controls until committed. There is no Pinia search store. |
| Home request state | Independent movie and genre snapshots shaped as `{ status, data, error }`. Active controllers and retry timers belong to the view scope. |

[Favorites store](src/stores/favoritesStore.js) lines 9–47 parses `favoritesList` without a guard. `toggleFavorite(movie)` finds the first strict ID match, adds or removes the snapshot, and serializes the whole array. `checkIsFavorite(movieId)` uses `.some()`. This avoids duplicates for ordinary well-formed movie records. Storage survives refresh and browser reopening on the same origin if available. There is no cross-tab listener, account sync, sessionStorage, IndexedDB, or backend storage. Malformed JSON, unexpected types and storage failures are unhandled.

Numeric IDs are scoped to the media entity. A future movie and series with the same ID must coexist in favorites and list rendering. Composite identities such as `movie:123` and `tv:123` are proposed. Legacy entries have no type and should be treated as movies, validated, kept in order, and migrated without discarding original snapshots on a failed write.

## Build, hosting and security

- **Repository** [wanjugi/Movie-Explorer](https://github.com/wanjugi/Movie-Explorer)
- **Public production** [MovieExplorer on Vercel](https://movie-explorer-nine-gilt.vercel.app/)
- **Scripts** `npm run dev` runs Vite with the local API middleware. `npm run build` writes client output to `dist/`. `npm run preview` serves the built frontend and local API. `npm test` runs the built-in test suite and `npm run verify` runs tests then builds. The legacy `npm run deploy` publishes to GitHub Pages, which cannot host this server API.
- **Local environment** The Vite adapter reads `TMDB_API_KEY` from the server process or Vite's private mode env files. No credential is needed for the frontend build or mocked tests. Windows commands and owner steps are in [README.md](README.md).
- **Vercel configuration** Use the Vite preset, a compatible Node runtime, `dist` output and a private `TMDB_API_KEY` in the intended environments. The function is discovered at `api/movies.js`, with its shared code outside the client and API route tree.
- **Routing precedence** Vue Router retains `createWebHistory` and the default root base. [vercel.json](vercel.json) rewrites only `/favorites` and `/movie/:id` to `/index.html`. The root uses the regular index. The rules do not match `/api`, unknown API paths, `/assets`, or `/favicon.ico`. Unknown app paths outside those rules receive the platform 404. Paths matching a movie route receive the SPA document, even if the movie ID is invalid or the API later returns 404. No client-side not-found view was added. [Vercel Vite routing](https://vercel.com/docs/frameworks/frontend/vite)
- **Known local differences** Vite supplies its own app HTML fallback. The local API middleware intercepts `/api` before it, returning JSON 404 for unrecognized API paths. Vite dev/preview do not execute Vercel rewrite rules. The rewrite config and local HTTP behavior can be tested locally. Vercel packaging and HTTP results need an owner-deployed preview or production instance.
- **Production history** The original audit found deep-link failures and a public key in the deployed JS. The owner subsequently confirmed Phase 3D passed 12 production checks and a credential scan, and reported the credential matter resolved. The owner manages automatic Vercel deployments from GitHub main.
- **Unverified for Phase 4A/4B** No deployment occurred during this work. Dashboard settings and environment scopes were not inspected. Existing metadata remains sparse and there is no SSR or prerender setup.

### Testing foundation

The 41 built-in Node tests cover mocked upstream requests, validation, safe failures, service contracts, Vercel rewrite scope, debounced navigation with Vue Router memory history, and request lifecycle behavior. The Vite integration test starts the app on an ephemeral loopback port, verifies the three SPA routes and unknown API behavior, mocks a successful upstream call, and checks transformed client modules for synthetic secret markers. It requires no real credentials. See [README.md](README.md#development-commands) for commands.

In later phases, Vitest with Vue Test Utils v2 and a compatible DOM emulator could add component coverage for persistence and resource views. The current phase uses real Vue composables and Vue Router memory history with the Node runner. Select Vitest and DOM versions against both supported Node lines and Vite 7. Current Vitest 5 requires Node 22.12 or newer in its supported lines. Vitest 4 can support Node 20 alongside Vite 7. Browser automation can later verify representative viewports, navigation and keyboard interactions. It adds browser binaries and CI maintenance, so the current phase retains Node tests alone. [Vitest setup](https://vitest.dev/guide/) · [Vue Test Utils v2](https://test-utils.vuejs.org/guide/)

## Technical debt register

| ID | Classification | Evidence and impact | Relevant source |
|---|---|---|---|
| T01 | Historical production exposure | Authentication is server-side. Owner reported production credential verification and resolution in Phase 3D. | Current server handler and prior public build |
| T02 | Historical production defect | Owner verified production deep links in Phase 3D. Phase 3C retains the rewrites and checks route behavior locally. | router lines 6–26 and vercel.json |
| T03 | Remaining detail state defect | Home and genres have independent feedback. Detail failures still appear as loading pending Phase 4C. | MovieDetailView, moviesApi |
| T04 | Resolved for Home | Obsolete list responses can no longer commit. Detail request lifecycle is deferred. | useLatestRequest, useMovieBrowseResults |
| T05 | Remaining detail navigation limitation | Global search navigates to Home with its URL state. A reused detail route still does not fetch a changed ID. | AppHeader, movieBrowseQuery, MovieDetailView |
| T06 | Confirmed persistence limitation | Invalid local data or denied writes can fail. Stored snapshots can grow stale. TV ID collisions would arise with numeric-only identity. | favoritesStore lines 14–37 |
| T07 | Architectural limitation | One page per result and no server cache or shared abuse quota. Home cancels obsolete requests and ignores equivalent route changes. | Shared server handler and useMovieBrowseResults |
| T08 | Maintenance issue | Repeated poster construction, unused Popular wrapper, prototype and unused store import/helper. Legacy GitHub Pages tooling awaits owner confirmation. | MovieCard, MovieDetailView, moviesApi, testView, favoritesStore, package.json |
| T09 | Partial quality infrastructure | Focused Node API tests exist. Component/browser suites, type/lint/format scripts and local CI remain absent. | test/ and package.json |
| T10 | Confirmed input/data gaps | Incomplete years are held in the draft and key detail fields are validated. Missing posters and optional detail metadata still need explicit presentation. | useMovieBrowseControls, moviesApi, MovieDetailView |
| T11 | Security hygiene | Private env files are now covered by ignore rules. Existing tracking and history remain unverified. | .gitignore |
| T12 | Missing features | TV browsing/details, seasons, episodes, mixed search, advanced filters, later list pages, and route metadata are absent. | router, moviesApi, Home and Details |
| T13 | Unverified runtime risks | Potential breakpoint overflow, browser-specific storage behavior, dependency advisory coverage and live TMDB rate limits were not exercised. | [Design defects](DESIGN_SYSTEM.md#known-visual-defects-and-candidate-fixes), package-lock, platform |
| T14 | Confirmed layout and accessibility gaps | Non-growing main displaces the short-page footer. Nested landmarks, contrast and visible focus gaps remain. | App, routed views, header and card. See [Design system](DESIGN_SYSTEM.md). |

## Proposed architecture for later phases

The following options are pending later implementation phases.

1. **Keep Vue, Vite, Tailwind and Pinia.** Improve the existing layers incrementally. JS can remain viable with runtime validation and checked contracts. Consider JSDoc or TypeScript at media, request and persistence boundaries if complexity warrants it.
2. **Build on the small movie function.** Verify packaging and rewrites on Vercel after deployment. Consider bounded caching and platform request limits if usage warrants them, and complete the credential cutover.
3. **Reuse the request lifecycle for future views.** Apply the independent pending, success, empty and error states to Details and later media routes. Add category-specific route keys and paging when authorized.
4. **Separate summaries from detail contracts.** Shared summaries can provide `mediaType`, source ID, display title/date, poster and rating. Map movie `title` and `release_date` and TV `name` and `first_air_date` intentionally. Keep movie runtime, TV season structures and episode details distinct. Any people search results need their own presentation contract.
5. **Keep existing movie URLs and share new resource routes.** Preserve `/movie/:id`. Candidate routes include `/tv/:id`, `/tv/:id/season/:seasonNumber` and `/tv/:id/season/:seasonNumber/episode/:episodeNumber`. Validate resource parameters, including valid season zero when applicable. Consider route query state for shareable search, filters and pages.
6. **Migrate favorites safely.** Introduce composite media identity, preserve existing movie order and useful display data, validate legacy entries and make migration retry-safe. Keep raw legacy data recoverable until a new write succeeds. Add accounts or database infrastructure only when explicitly approved requirements justify it.
7. **Expand automated regression coverage.** The current Node tests cover API behavior and routing config. Add UI response-state and race tests, checks for parameter changes and deployed direct routes, and future favorite identity, persistence and responsive accessibility checks.

### Owner’s planned design direction

The owner prefers a cinematic dark homepage with green branding and dividers, minimalist poster-focused cards, rounded consistently sized posters, titles and release years, and prominent search. Separate movie and TV sections with View all links and discovery categories are future concepts. The current appearance remains documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). The owner will approve visual changes in a later phase.
