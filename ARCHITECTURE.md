# MovieExplorer architecture

**Baseline version 9 · 2026-11-26 · Cinematic refinement**

This reference describes the local source. Production observations distinguish previous audit results and owner-confirmed Phase 3D verification. Phases 5–8B are implemented locally and awaiting owner deployment. See [Design system](DESIGN_SYSTEM.md) for visual specifications and [Agent instructions](AGENTS.md) for workflow and preservation rules.

## Purpose and stack

MovieExplorer is a client-rendered Vue SPA for discovering movies and TV series, searching titles, inspecting movies, series, seasons and episodes, and storing browser-local favorites. Same-origin metadata requests go through Vercel-compatible functions. Public artwork loads directly from the TMDB image CDN.

Versions below are resolved direct dependencies in [package-lock.json](package-lock.json), whose lockfile version is 3. Manifest ranges are in [package.json](package.json). These versions do not establish the full production dependency graph.

| Dependency | Locked version | Responsibility |
|---|---:|---|
| Vue | 3.5.46 | Single-file components, Composition API and rendering |
| Vue Router | 4.6.3 | HTML5 history, routes and links |
| Pinia | 3.0.3 | Shared favorites state |
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
├─ public/{favicon.ico,movie-explorer.svg,tmdb-logo.svg}
└─ src/
   ├─ App.vue
   ├─ main.js
   ├─ assets/main.css
   ├─ components/
   │  ├─ AppFooter.vue
   │  ├─ AppHeader.vue
   │  ├─ CataloguePagination.vue
   │  ├─ ContentState.vue
   │  ├─ DiscoveryFilters.vue
   │  ├─ MediaPoster.vue
   │  ├─ MovieCard.vue
   │  └─ MovieCardSkeleton.vue
   ├─ catalogue/{movieFilters,moviePages}.js
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
| [index.html](index.html), [favicon SVG](public/movie-explorer.svg), and [ICO fallback](public/favicon.ico) | Branded HTML shell with English language, title and description for movies and TV series, and original MovieExplorer favicon. |
| [src/main.js](src/main.js) | Creates the Vue app, imports CSS, installs Pinia then router, and mounts to `#app`. |
| [src/App.vue](src/App.vue) | Shared header, flexible single main landmark and normal-flow footer. |
| [src/assets/main.css](src/assets/main.css) | Tailwind and shared shell, frame, grid, poster, tile and focus geometry. Imported in `main.js`. |
| [src/components/AppHeader.vue](src/components/AppHeader.vue) | Persistent navigation and search form. Edits a local draft and commits through Vue Router. |
| [src/components/AppFooter.vue](src/components/AppFooter.vue) | Static author, technology and TMDB credits. |
| [src/components/MovieCard.vue](src/components/MovieCard.vue) | Reused by Home and Favorites. Requires a `movie` object prop, links to details and calls favorites actions. |
| [src/components/MediaPoster.vue](src/components/MediaPoster.vue) | Shared responsive TMDB poster and local missing-image presentation. Used by cards and movie details. |
| [src/components/MovieCardSkeleton.vue](src/components/MovieCardSkeleton.vue) | Home loading placeholder using shared tile and poster geometry. |
| [src/components/ContentState.vue](src/components/ContentState.vue) | Shared empty and error feedback with optional existing actions. |
| [src/components/CataloguePagination.vue](src/components/CataloguePagination.vue) | Bounded link navigation, current page and validated direct jump. The caller provides page URLs. |
| [src/components/DiscoveryFilters.vue](src/components/DiscoveryFilters.vue) | Advanced Discover drafts and validation. Applies a batch to the parent route. |
| [src/catalogue/movieFilters.js](src/catalogue/movieFilters.js) and [src/catalogue/moviePages.js](src/catalogue/moviePages.js) | Public catalogue options, client/server validation and paging helpers shared across boundaries. |
| [src/router/index.js](src/router/index.js) | Route definitions and HTML5 history. Used by bootstrap. |
| [src/services/moviesApi.js](src/services/moviesApi.js) | Same-origin Fetch wrappers for the movie function. Returns validated arrays or a detail object. Supports opt-in normalized errors and cancellation, and retains default empty/null fallbacks. |
| [src/router/movieBrowseQuery.js](src/router/movieBrowseQuery.js) | Normalizes catalogue query state, selects the effective operation and parameters, and writes canonical Home URLs. |
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
| [vercel.json](vercel.json) | Scoped SPA rewrites for known client deep links. |
| [test/](test) | Built-in Node tests for API validation, frontend contracts, versioned rewrites and local Vite HTTP integration. |
| [package.json](package.json) and [package-lock.json](package-lock.json) | Package metadata, scripts, direct dependencies, and resolved npm dependency tree. |
| [.vscode/extensions.json](.vscode/extensions.json) and [README.md](README.md) | Vue editor recommendation and project setup, verification and deployment instructions. |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [AGENTS.md](AGENTS.md) | Visual baseline and repository rules. |

## Initialization and data flow

```text
index.html -> pre-paint theme -> main.js (CSS + Vue + Pinia + Router) -> App.vue
  persistent AppHeader -> theme preference / debounced search -> router query
  main -> RouterView
    CinemaHomeView -> shared weekly trending requests -> hero and rails
    Movies, TV and Search -> router query -> latest request -> same-origin APIs -> TMDB
    MovieCard -> image CDN / media route / Pinia favorites
    FavoritesView <- movie and TV snapshots -> MovieCard
    Movie/TV details -> same-origin APIs -> TMDB detail metadata and available credits
  single trailer session -> lazy dialog or preview -> same-origin metadata / YouTube player
  persistent AppFooter
```

1. The index document loads the module entry. The bootstrap installs plugins before mounting to `#app`.
2. The shell renders the header and footer around the route outlet. The header synchronizes its input draft with the active route and commits valid searches through Vue Router.
3. Movies and TV select the requested catalogue or default Discover. Genres load independently when Discover is active. Global title search has its own route.
4. Only the active request may publish results or errors. Cards use media-aware identity where mixed media are displayed. Images are fetched directly by the browser.
5. The favorites store initializes from local storage when first consumed. Every card reads shared membership and calls the store directly. Favorites renders the same card from a stored snapshot.
6. Detail views request metadata by reactive route keys. The television service can reuse recent successful series and season responses.

The route is the source of truth for committed search and filters. Pinia retains favorites only. Control drafts represent uncommitted input. Requests are scoped to each view. The television service keeps only a small, short-lived cache for successful series and season metadata.

## Routes and navigation

[Router source](src/router/index.js) uses `createWebHistory(import.meta.env.BASE_URL)`.

| Path | Route name | View | Loading and input |
|---|---|---|---|
| `/` | `home` | CinemaHomeView | Lazy cinematic dashboard. Recognized legacy catalogue queries redirect to Movies. |
| `/movies` | `movies` | HomeView | Lazy dedicated movie catalogue. |
| `/tv` | `tv` | TvBrowseView | Lazy TV catalogue with independent query state. |
| `/search` | `search` | SearchView | Lazy global title search. |
| `/favorites` | `favorites` | FavoritesView | Lazy dynamic import. |
| `/movie/:id` | `movie-details` | MovieDetailView | Lazy. Validated positive movie ID. |
| `/tv/:id` | `tv-details` | TvDetailView | Lazy. Positive series ID. |
| `/tv/:id/season/:seasonNumber` | `tv-season` | TvDetailView | Lazy. Season number may be zero. |
| `/tv/:id/season/:seasonNumber/episode/:episodeNumber` | `tv-episode` | TvDetailView | Lazy. Season and episode numbers are nonnegative. |

The brand and Home links target the cinematic dashboard. The header and the Home discovery form send title searches to `/search`. Movies retains its separately labeled movie-only search. Legacy root links keep their query and hash as they resolve to Movies. Clearing a movie search or resetting its filters stays in Movies. Movie Details uses the existing latest-request controller to load by validated ID and show loading, failure and retry. Broader Phase 4C work remains deferred.

### URL, input and history policy

- Home accepts `q`, `category`, `period`, `page`, `genre`, `year`, `from`, `to`, `language`, `rating`, `votes`, `runtimeMin`, `runtimeMax`, and `sort`. All are independently normalized. App-written URLs omit default Discover, weekly Trending, popularity sort, page one and blank fields. Unknown and duplicate keys never reach TMDB.
- A title search takes precedence over category and filters. Existing Home category and Discover filters remain in the search URL as paused state. Clear returns to that mode and its filters on page one. A search from a different route starts without paused settings. Official feeds accept no Discover filters from this app and preserve them for return to Discover.
- Search commits after 350 ms or immediately on Enter. The first search and different explicit submissions push history. Debounced edits to active searches replace the current entry. Equivalent inputs cause no navigation or fetch. Route transitions and scope disposal cancel pending timers.
- Genre and valid exact-year edits keep the previous interaction. Genre commits immediately. An exact year commits after 350 ms or Enter, and clears a committed range. Advanced fields apply as one batch. An applied nonempty range replaces the exact year. If a direct URL contains both, the exact year wins. The API rejects conflicting or inverted bounds.
- Changes to effective criteria start at page one. Page links and the jump form preserve effective criteria and paused state. Refresh and Back/Forward return to the committed URL. Explicit page navigation moves to the results heading. History navigation uses the browser's saved position when available. Draft editing causes no explicit scroll.
- Example URLs include `/?page=2`, `/?q=Interstellar&page=2`, `/?category=top-rated&page=5`, `/?category=trending&period=day`, and `/?from=1980&to=1989&language=ko&rating=7&sort=rating`.

## TMDB integration and request behavior

`Browser → GET /api/movies → Vercel Function → TMDB v3`.

[Frontend service](src/services/moviesApi.js) exposes the same five functions. [Vercel entry](api/movies.js) passes requests to the [shared handler](server/movies.js). Authentication uses server-only `TMDB_API_KEY` and the TMDB v3 `api_key` parameter on the upstream HTTPS request. The browser sees neither the credential nor the authenticated URL. Vite `envPrefix: []` limits client environment exposure to its built-ins, including `BASE_URL`. The local adapter loads `TMDB_API_KEY` on the server for dev and preview.

All operations use `GET /api/movies?operation=...`. The upstream origin is fixed at `https://api.themoviedb.org/3`. The handler sets its own `Accept: application/json` and refuses redirects. It forwards no caller headers or authentication.

| Operation | Public parameters beyond `operation` | Fixed upstream behavior |
|---|---|---|
| `discover` | Optional `page` and supported Discover fields below | `/discover/movie` with `include_adult=false`, `language=en-US` and default `sort_by=popularity.desc` |
| `search` | Required `query`, optional `page` | `/search/movie` with `include_adult=false`, `language=en-US`; Discover criteria remain paused |
| `popular` | Optional `page` | `/movie/popular` |
| `top-rated` | Optional `page` | `/movie/top_rated` |
| `now-playing` | Optional `page` | `/movie/now_playing` |
| `upcoming` | Optional `page` | `/movie/upcoming` |
| `trending` | Optional `period=day\|week`, defaults to week | `/trending/movie/{time_window}` with `language=en-US`; the documented operation does not expose a page query |
| `genres` | None | `/genre/movie/list` with `language=en` |
| `details` | Required `id` | `/movie/{id}` with `language=en-US` and fixed `append_to_response=credits` |

Official paged movie lists use the unchanged English display locale. The app does not send a region, and Now Playing and Upcoming do not claim local availability. Trending and official lists omit the undocumented `include_adult` argument. They keep records explicitly marked `adult: false`. Discover and Search also discard explicit adult records. Provider counts are preserved and can therefore exceed the number of displayable cards.

Discover validates each field before mapping it to TMDB:

| App keys | Rule | TMDB parameters |
|---|---|---|
| `genre`, `year` | One canonical positive movie genre ID, exact year 1000–9999 | `with_genres`, `primary_release_year` |
| `from`, `to` | Optional inclusive years, ordered if both present, mutually exclusive with `year` | `primary_release_date.gte` with January 1, `primary_release_date.lte` with December 31 |
| `language` | Curated two-letter original language allowlist, with blank meaning all languages | `with_original_language`; metadata locale remains `en-US` |
| `rating`, `votes` | Minimum rating 0.1–10 in tenths; positive minimum votes up to a 32-bit integer | `vote_average.gte`, `vote_count.gte` |
| `runtimeMin`, `runtimeMax` | Whole minutes 1–1440, ordered if both present | `with_runtime.gte`, `with_runtime.lte` |
| `sort` | `popular`, `rating`, `votes`, `newest`, `oldest`, `revenue` | `sort_by`, with explicit documented popularity, vote, primary-release-date and revenue sort values |

The original language list is local and finite. Multi-genre combinations and country filtering are outside the supported surface. The API rejects them and all other unexpected or duplicate keys. Page parameters are canonical integers 1–500. Omission defaults to one on paginated operations. Titles are trimmed, support up to 160 Unicode code points, and cannot contain control characters. IDs are positive 32-bit decimal integers. Query length is capped at 4096 characters. The server owns the host, credential, upstream parameter names, and appended credits.

[TMDB Discover](https://developer.themoviedb.org/reference/discover-movie) · [TMDB Search](https://developer.themoviedb.org/reference/search-movie) · [TMDB OpenAPI](https://developer.themoviedb.org/openapi) · [TMDB page errors](https://developer.themoviedb.org/docs/errors) · [Popularity and Trending](https://developer.themoviedb.org/docs/popularity-and-trending)

Catalogue operations validate and preserve `page`, `results`, `total_pages` and `total_results`. The handler checks the object and list shapes used by the client, including detail ID, rating and appended cast. It rejects invalid JSON, unexpected data, and responses reflecting the exact key. A single eight-second deadline covers upstream fetch and body reading. No automatic retries occur. Errors are JSON `{ error: { code, message } }` and exclude raw upstream text, URLs and headers. A safe numeric or canonical HTTP-date `Retry-After` may be passed through for 429 or 503.

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

The five legacy service functions accept optional `{ signal, throwOnError }` as their final argument. Valid responses preserve the previous arrays or detail object. With `throwOnError: true`, network failures, invalid responses, and HTTP errors produce a safe `MovieApiError` with a classification, HTTP status where available, retry eligibility, and a retry deadline where applicable. The client never displays upstream response text. The default still returns `[]` for list failures and `null` for detail failures. A supplied aborted signal is propagated as cancellation even in fallback mode.

Home calls error-aware `fetchMoviePage(operation, parameters, { signal })`, which returns the full page envelope. Its request key includes the effective operation, its supported criteria and its page. Changes irrelevant to that operation do not request results again. Each new load aborts its predecessor and takes ownership. The ownership check guards both results and errors even if an obsolete response arrives after abort. Route departure and scope teardown cancel active requests. This is browser-side cancellation. The server's existing eight-second upstream deadline still applies.

Movies presents distinct idle, loading, populated success, empty success, and error states. It drops obsolete cards on a new committed request. Empty states offer clearing search or filters when applicable. Genres have a separate lifecycle and manual retry. Retry uses the last active operation and is available only after a retryable failure. Safe `Retry-After` on 429 or 503 disables retry until due. Movie Details opts into the same error-aware service and the shared request lifecycle.

The UI exposes at most `min(total_pages, 500)` pages per paginated query and one page for Trending. Typical 20-result pages yield a window of up to 10,000 provider results per query. The result total is the provider's reported match count and does not represent browseable pages or the entire TMDB catalogue. When an upstream response shows a requested page no longer available, the view offers a valid recovery link without fetching automatically. An empty result set provides no nonexistent page links. No pages are prefetched or stored in bulk.

Posters continue to use the Phase 5 public responsive TMDB CDN presentation. See [Design system](DESIGN_SYSTEM.md#card-and-poster-geometry).

Phase 5 presents the existing Home loading state as a skeleton grid. Empty and error states use a visual component, preserving the Phase 4A/4B cancellation and retry behavior. Phase 4C Movie Details reliability, 4D Favorites storage reliability, and 4E additional frontend regression testing remain deferred.

## Current data contracts

Fields below describe the shapes the app receives or reads. The service validates the fields needed for successful list, genre and detail responses.

| Contract | Current shape and usage |
|---|---|
| Movie summary | Raw TMDB result with numeric `id`, `title`, `release_date` and `poster_path` consumed directly by cards. Results can also contain `original_title`, `original_language`, `genre_ids`, `overview`, `backdrop_path`, `popularity`, `vote_average`, `vote_count`, `adult` and `video`. There is no added media type or normalization. |
| Movie detail | Raw object, initially `null`. Reads `title`, `poster_path`, `tagline`, `overview`, `release_date`, `runtime`, `vote_average`, `vote_count` and `credits.cast`. Other base fields such as original title, genres, backdrop, production and financial metadata are unused. |
| Genres | Array of `{ id, name }` from TMDB. Local Home state starts empty and populates the selector. Detail genre objects are unused. |
| Credits | Appended `credits` object can contain `cast` and `crew`. The template reads `cast.slice(0, 5)` and actor `id` and `name`. Crew and other cast properties do not render. |
| Favorites | `favoritesList:v2` in localStorage holds `{version: 2, favorites: [...]}`. The legacy `favoritesList` array stays readable and intact. |
| Search and filter state | Home route query holds the validated title, feed, criteria and page. Draft text stays in the controls until committed. There is no Pinia search store. |
| Home request state | Independent movie and genre snapshots shaped as `{ status, data, error }`. Active controllers and retry timers belong to the view scope. |

[Favorites store](src/stores/favoritesStore.js) shares membership and snapshots through Pinia. [Storage adapter](src/stores/favoritesStorage.js) reads v2 first, or loads valid legacy movie entries if v2 is absent. It deduplicates by `movie:ID` or `tv:ID`, preserves order and existing fields, and adds the media type. Initialization performs no writes. The first user mutation writes and reads back a v2 envelope, leaving `favoritesList` intact as a rollback snapshot. Future reads treat v2 as authoritative. An older build reads the legacy snapshot, so later v2 edits do not carry back.

Corrupt v2 data shows a valid subset or recoverable legacy movies and blocks persistence. With partially invalid legacy data, valid records remain usable and the raw original key is preserved. Storage rejection or a detected concurrent v2 edit leaves the change in memory and surfaces a warning in Favorites. The store checks before writing but cannot atomically lock localStorage across tabs. There is no cross-tab synchronization or account sync.

## Build, hosting and security

- **Repository** [wanjugi/Movie-Explorer](https://github.com/wanjugi/Movie-Explorer)
- **Public production** [MovieExplorer on Vercel](https://movie-explorer-nine-gilt.vercel.app/)
- **Scripts** `npm run dev` runs Vite with the local API middleware. `npm run build` writes client output to `dist/`. `npm run preview` serves the built frontend and local API. `npm test` runs the built-in test suite and `npm run verify` runs tests then builds. The legacy `npm run deploy` publishes to GitHub Pages, which cannot host this server API.
- **Local environment** The Vite adapter reads `TMDB_API_KEY` from the server process or Vite's private mode env files. No credential is needed for the frontend build or mocked tests. Windows commands and owner steps are in [README.md](README.md).
- **Vercel configuration** Use the Vite preset, a compatible Node runtime, `dist` output and a private `TMDB_API_KEY` in the intended environments. The function is discovered at `api/movies.js`, with its shared code outside the client and API route tree.
- **Routing precedence** Vue Router retains `createWebHistory` and the default root base. [vercel.json](vercel.json) explicitly rewrites the client paths in the route table to `/index.html`, with the root handled by the regular index. API paths, assets and favicons remain outside these rules. Known route patterns can serve the SPA even when the resource itself is invalid or missing. Unknown paths outside those patterns receive the platform 404. [Vercel Vite routing](https://vercel.com/docs/frameworks/frontend/vite)
- **Known local differences** Vite supplies its own app HTML fallback. The local API middleware intercepts `/api` before it, returning JSON 404 for unrecognized API paths. Vite dev/preview do not execute Vercel rewrite rules. The rewrite config and local HTTP behavior can be tested locally. Vercel packaging and HTTP results need an owner-deployed preview or production instance.
- **Production history** The original audit found deep-link failures and a public key in the deployed JS. The owner subsequently confirmed Phase 3D passed 12 production checks and a credential scan, and reported the credential matter resolved. The owner manages automatic Vercel deployments from GitHub main.
- **Unverified for Phase 4A/4B** No deployment occurred during this work. Dashboard settings and environment scopes were not inspected. Existing metadata remains sparse and there is no SSR or prerender setup.

### Testing foundation

The built-in Node tests cover mocked upstream requests, validation, safe failures, service contracts, Vercel rewrite scope, debounced navigation with Vue Router memory history, request lifecycle behavior, and synthetic favorites migration. The Vite integration test starts the app on an ephemeral loopback port, checks SPA deep links and unknown API behavior, and verifies both API integrations and transformed modules using synthetic secret markers. It requires no real credentials. See [README.md](README.md#development-commands) for commands.

In later phases, Vitest with Vue Test Utils v2 and a compatible DOM emulator could add component coverage for persistence and resource views. The current phase uses real Vue composables and Vue Router memory history with the Node runner. Select Vitest and DOM versions against both supported Node lines and Vite 7. Current Vitest 5 requires Node 22.12 or newer in its supported lines. Vitest 4 can support Node 20 alongside Vite 7. Browser automation can later verify representative viewports, navigation and keyboard interactions. It adds browser binaries and CI maintenance, so the current phase retains Node tests alone. [Vitest setup](https://vitest.dev/guide/) · [Vue Test Utils v2](https://test-utils.vuejs.org/guide/)

## Technical debt register

| ID | Classification | Evidence and impact | Relevant source |
|---|---|---|---|
| T01 | Historical production exposure | Authentication is server-side. Owner reported production credential verification and resolution in Phase 3D. | Current server handler and prior public build |
| T02 | Historical production defect | Owner verified production deep links in Phase 3D. Phase 3C retains the rewrites and checks route behavior locally. | router lines 6–26 and vercel.json |
| T03 | Movie detail state corrected in Phase 8 | Movie Details displays separate loading, failure, missing and retry states. Broader validation remains deferred. | MovieDetailView, moviesApi |
| T04 | Resolved for Home | Obsolete list responses can no longer commit. Detail request lifecycle is deferred. | useLatestRequest, useMovieBrowseResults |
| T05 | Movie detail navigation corrected in Phase 8 | Movie Details fetches a changed ID and cancels the superseded request. | MovieDetailView |
| T06 | Remaining storage limitations | The migration protects saved data and separates identities. Stored snapshots can grow stale, and cross-tab synchronization remains deferred. | favoritesStore, favoritesStorage |
| T07 | Architectural limitation | TMDB caps the accessible page window. There is no server cache or shared abuse quota. Home cancels obsolete requests and ignores equivalent route changes. | Shared server handler and useMovieBrowseResults |
| T08 | Maintenance issue | Unused Popular wrapper, prototype and unused store import/helper. Legacy GitHub Pages tooling awaits owner confirmation. | moviesApi, testView, favoritesStore, package.json |
| T09 | Partial quality infrastructure | Focused Node API tests exist. Component/browser suites, type/lint/format scripts and local CI remain absent. | test/ and package.json |
| T10 | Remaining detail data gaps | Invalid year drafts are held and most detail fields are validated. A shared poster handles missing images. Optional detail metadata still needs more explicit presentation. | useMovieBrowseControls, moviesApi, MovieDetailView |
| T11 | Security hygiene | Private env files are now covered by ignore rules. Existing tracking and history remain unverified. | .gitignore |
| T12 | Remaining catalogue features | Phase 8 provides real cinematic shelves and television backdrops. Advanced discovery remains future work. | router, Home and TV views |
| T13 | Unverified runtime risks | Broad cross-browser, zoom, storage and live TMDB behavior still need acceptance. | [Design system](DESIGN_SYSTEM.md), deployment platform |
| T14 | Resolved shell defect, targeted accessibility improvements | Growing main keeps the footer after content or at the viewport edge. Phase 5 improves focus, contrast and control semantics in the affected components. | App, routed views, header and card. See [Design system](DESIGN_SYSTEM.md). |

## Proposed architecture for later phases

The following options are pending later implementation phases.

1. **Keep Vue, Vite, Tailwind and Pinia.** Improve the existing layers incrementally. JS can remain viable with runtime validation and checked contracts. Consider JSDoc or TypeScript at media, request and persistence boundaries if complexity warrants it.
2. **Verify both functions in production.** Check packaging and scoped rewrites after owner deployment. Consider platform request limits if usage warrants them.
3. **Apply reliable request state to Movie Details.** Reuse the TV detail lifecycle when the deferred movie reliability phase is approved.
4. **Keep summary and detail contracts distinct.** Expand the shared card fields only when the design needs them.
5. **Preserve shareable routes.** Keep existing movie and television URLs and their current query semantics when creating the cinematic Home.
6. **Keep browser favorites compatible.** Carry the media-aware identity and migration strategy through future visual changes. Add account or database infrastructure only if expressly approved.
7. **Expand automated regression coverage.** The current Node tests cover API behavior and routing config. Add UI response-state and race tests, checks for parameter changes and deployed direct routes, and future favorite identity, persistence and responsive accessibility checks.

### Phase 8 visual direction

Phase 8 implements the cinematic dark homepage, green film branding, poster-focused cards, search and separate movie and TV discovery sections. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) records the current appearance and its responsive and accessibility rules.

### Phase 6 verification and deferred work

Build and focused mocked checks cover allowlisted endpoints, page limits, advanced filter mapping, route history and compatibility. Comprehensive frontend, cross-browser and live TMDB/Vercel verification are deferred.

## Phase 7 TV and global search

`Browser → same-origin /api/movies or /api/tv → Vercel entry or local Vite adapter → server/tmdb.js → TMDB v3`.

[Television dispatcher](server/tv.js) and the movie dispatcher share the server transport, credentials, GET enforcement, duplicate and unexpected parameter rejection, fixed host, eight-second timeout, redirect rejection, no-store, safe Retry-After and filtered error mapping. [api/tv.js](api/tv.js) and the [Vite adapter](server/vite-movie-api.js) expose the same TV dispatcher. Each operation has its own allowlist.

| `/api/tv` operation | Accepted parameters besides `operation` | TMDB v3 path |
|---|---|---|
| `discover` | `page`, `genre`, `year`, `from`, `to`, `language`, `rating`, `votes`, `sort` | `/discover/tv` |
| `search`, `multi-search` | Required `query`, optional `page` | `/search/tv`, `/search/multi` |
| `popular`, `top-rated`, `airing-today`, `on-the-air` | Optional `page` | `/tv/popular`, `/tv/top_rated`, `/tv/airing_today`, `/tv/on_the_air` |
| `trending` | Optional `period` (`day` or default `week`) | `/trending/tv/{time_window}` |
| `genres` | None | `/genre/tv/list` |
| `details` | Required `id` | `/tv/{id}`, fixed `append_to_response=credits` |
| `season` | Required `id`, `season` | `/tv/{id}/season/{season}` |
| `episode` | Required `id`, `season`, `episode` | `/tv/{id}/season/{season}/episode/{episode}` |

- TV series IDs are positive int32 values. Season and episode numbers are nonnegative int32 values with no signs, leading zeros or fractional syntax. Season 0 covers Specials. Navigation links use actual numbers from the parent response.
- TV Discovery uses its own genre list and first-air year/date fields. Valid years run 1000–9999. An exact year replaces the range, and the API rejects conflicting or inverted ranges. Language uses the curated original-language list while metadata stays English. Rating accepts 0.1–10, votes positive int32. Sort values `popular`, `rating`, `votes`, `newest` and `oldest` map to official sorting. Status, country, networks and series type remain possible future filters.
- [TV query state](src/router/mediaBrowseQuery.js) retains Discover filters while ranking feeds use only category, page and applicable Trending period. Search uses `q`, optional `type=movie|tv` and optional `page`. The existing debounce and history policy applies. Clearing global search clears its results, and Back returns to the previous catalogue. Clearing movie-catalogue search resumes that catalogue's saved criteria.
- Paged operations preserve `{ page, results, total_pages, total_results }`. Requests are bounded to 500 pages, shortened to the provider's available page count. Trending shows one provider window per period. Mixed search keeps provider counts, including people, while only eligible movie and TV records appear. Sparse or empty filtered pages are never filled by fetching ahead.
- TV Discover and TV and multi-search explicitly request `include_adult=false`. Official feeds do not accept that input, so the server drops explicit adult records and relies on TMDB's feed rules for records without an adult field. Trending and mixed search require an explicit non-adult marker. Each catalogue uses its endpoint's actual capabilities. [TMDB TV Discover](https://developer.themoviedb.org/reference/discover-tv) · [TMDB multi-search](https://developer.themoviedb.org/reference/search-multi) · [TMDB OpenAPI](https://developer.themoviedb.org/openapi)
- [CatalogueResults](src/components/CatalogueResults.vue) reuses the poster grid, skeleton, feedback and pagination for TV and search. [Media identity](src/catalogue/mediaIdentity.js) adapts `title`/`release_date` and `name`/`first_air_date` for the shared card and favorites. [TV details](src/views/TvDetailView.vue) use a single view with separate series, season and episode request contracts. It loads only selected resources and necessary parent metadata. [TV service](src/services/tvApi.js) keeps up to eight successful series and season responses in memory for up to three minutes. If supplemental metadata fails, the primary resource and direct parent links remain usable, with unavailable neighbors omitted.
- [Route requests](src/composables/useRouteRequest.js) key the existing abortable latest-request lifecycle to the effective URL. Route changes and disposal cancel superseded client work. Retry uses the winning route and safe Retry-After. Browser cancellation does not guarantee upstream cancellation.

## Phase 8 cinematic dashboard and detail presentation

- [CinemaHomeView](src/views/CinemaHomeView.vue) runs one Trending movie and one Trending television request immediately. Eligible backdrop results supply up to five slides and the same responses power the two Trending shelves. Six other sections each have a page-one request that begins near the viewport, for at most eight initial catalogue calls across the complete dashboard. No per-card detail requests are made. Each shelf uses existing latest-request cancellation, empty/error state and manual retry.
- [CinemaRail](src/components/CinemaRail.vue), [MediaDetailHero](src/components/MediaDetailHero.vue), and [TitleSearch](src/components/TitleSearch.vue) share presentation while leaving API and persistence behavior in existing services and stores. The media card keeps its composite identity. The v2 Favorites storage and legacy rollback behavior are unchanged.
- The Vue Router guard recognizes existing movie catalogue query keys on `/` and forwards their query and hash to `/movies`. Existing normalization runs in the movie catalogue. Search clearing and filter resets stay on the dedicated route. Bare Home and unrelated queries still resolve to the dashboard. Existing Vercel rewrite and function configuration are unchanged.
- Movie Details now validates the route ID, reacts to changes, cancels obsolete requests and exposes explicit loading, missing and retryable error states through the existing request composable. The movie service's existing default contract remains available. Genre and credits fields already in its detail payload feed the redesigned view. Television resources keep the Phase 7 request contracts and use their existing artwork and metadata.

Broader Phase 4C Movie Details reliability, 4D Favorites reliability and 4E comprehensive frontend regression tests remain deferred, apart from the narrow rendering and migration safeguards already implemented. Phase 9 advanced discovery and Phase 10 final verification and deployment are future work.

## Phase 8B theme and trailer boundaries

The external classic pre-paint script in [index.html](index.html) resolves `movieExplorer.theme` to an explicit light or dark root attribute. The theme toggle reads the same preference owner. Theme changes are CSS-driven with no route or data changes. The separate `movieExplorer.trailerPreviews` preference is false by default. Neither preference uses the Favorites keys.

Both existing JSON endpoints allow `operation=videos&id=<positive int32>`. [server/videos.js](server/videos.js) maps only the movie and TV operation paths to the corresponding TMDB v3 videos endpoint (en-US). The server validates upstream title ID and results array and returns at most three deduplicated YouTube entries with only `key` and `type`. Official locale-preferred trailers rank first, then other trailers, then labeled official teasers. The same GET, timeout, redirect, safe error, no-store and rate-limit controls still apply. No YouTube Data API key or extra infrastructure is used.

[trailerLookup.js](src/services/trailerLookup.js) coalesces compatible in-flight requests and aborts the upstream browser request after its last consumer leaves. Lookup keys include media type, ID and locale. A 24-entry in-memory cache uses 10 minutes for positive metadata and one minute for confirmed empty results. Transient errors are never cached. [trailerSession.js](src/composables/trailerSession.js) owns one active session. App closes before navigation, and disposal cancels lookups and destroys the player. Explicit playback uses a native dialog with disclosure before loading YouTube. Close, Escape, title changes and document hiding release playback. The provider can block playback or embedding, in which case native Play or an external fallback remains available.

The optional desktop preview starts over the featured Watch trailer control after one second at a minimum 1400px width, with fine hover and reduced motion off. Its unobstructed panel is outside both hero artwork and rail clipping contexts. The player verifies visible geometry, mutes first, and attempts autoplay once. Scroll, resize, hiding, lost visibility, pointer dismissal or Escape clears the owner. Poster hover stays artwork-only. Trailer eligibility and autoplay remain browser/provider dependent.

Phase 8B extends only video metadata operations. Existing catalogue, detail, Favorites and Vercel route contracts stay intact. Local `npm.cmd run verify` passed 60 tests and a production build. Isolated Chrome opened the major routes in both themes, tested keyboard theme persistence, poster motion and reduced motion, checked rail boundaries, and verified the 320px trailer dialog without horizontal overflow. Mocked player callbacks verified disclosure, mute-before-autoplay, blocked autoplay feedback, close and route cleanup. Live YouTube playback, comprehensive cross-browser testing and assistive-technology testing remain outstanding.
