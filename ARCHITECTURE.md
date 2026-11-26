# MovieExplorer architecture

**Baseline version 1 · 2026-11-26 · Existing movie-only application**

This reference describes what is implemented in the local source. Production observations are from the preceding read-only audit. Future architecture is recorded separately below. See [Design system](DESIGN_SYSTEM.md) for visual specifications and [Agent instructions](AGENTS.md) for workflow and preservation rules.

## Purpose and stack

MovieExplorer is a client-rendered Vue SPA for discovering movies, searching titles, inspecting movie details, and storing favorites in a browser. It has three routes and calls TMDB directly. There is no application backend, user account system, database, or TV functionality.

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

The project uses JavaScript ES modules. Node engine is `^20.19.0 || >=22.12.0`. No npm version, linting, formatting, automated type checking, tests, mocking, or local CI workflow is configured. SVG icons are inline. Native browser APIs provide Fetch, history, and storage.

## Repository map and responsibilities

Generated output, dependencies, and repository internals are omitted.

```text
.
├─ .env.local
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
| [src/services/moviesApi.js](src/services/moviesApi.js) | Native Fetch wrappers for TMDB. Used by Home and Details. Includes an unused Popular helper. |
| [src/stores/searchStore.js](src/stores/searchStore.js) | Shared in-memory query. Header writes and Home reads. |
| [src/stores/favoritesStore.js](src/stores/favoritesStore.js) | Shared snapshots and localStorage persistence. Used by MovieCard and FavoritesView. |
| [src/views/HomeView.vue](src/views/HomeView.vue) | Owns results, genres, filters, and request lifecycle. Renders MovieCard. |
| [src/views/FavoritesView.vue](src/views/FavoritesView.vue) | Lazy route rendering saved snapshots and an empty state. Renders MovieCard. |
| [src/views/MovieDetailView.vue](src/views/MovieDetailView.vue) | Fetches details and appended credits for the ID captured on mount. Displays details and history Back. |
| [src/views/testView.vue](src/views/testView.vue) | Unrouted detail prototype. It has no test runner or assertions. |
| [vite.config.js](vite.config.js) and [jsconfig.json](jsconfig.json) | Vite enables Vue and DevTools and maps `@` to `src`. JS configuration mirrors alias for tooling and excludes generated directories. |
| [postcss.config.js](postcss.config.js), [tailwind.config.js](tailwind.config.js) | PostCSS loads Tailwind 3 and Autoprefixer. Tailwind scans HTML and source, enables forms, and extends no theme tokens. |
| [.gitignore](.gitignore) and `.env.local` | Ignore rules cover dependencies, output and `*.local`. Local environment provides `VITE_TMDB_API_KEY`. No values belong in documentation. |
| [package.json](package.json) and [package-lock.json](package-lock.json) | Package metadata, scripts, direct dependencies, and resolved npm dependency tree. |
| [.vscode/extensions.json](.vscode/extensions.json) and [README.md](README.md) | Vue editor recommendation and starter Vue/Vite setup notes. |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [AGENTS.md](AGENTS.md) | Visual baseline and repository rules. |

## Initialization and data flow

```text
index.html -> main.js (CSS + Vue + Pinia + Router) -> App.vue
  persistent AppHeader -> Pinia searchQuery ----+
  main -> RouterView                           |
    HomeView <---------------------------------+
      local filters -> moviesApi -> TMDB Discover / Search / Genres
      results -> MovieCard -> image CDN / movie route / Pinia favorites
    FavoritesView (lazy) <- Pinia favorites <-> localStorage favoritesList
      snapshots -> MovieCard
    MovieDetailView -> moviesApi -> TMDB detail + appended credits
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

[Service source](src/services/moviesApi.js) uses TMDB v3 at `https://api.themoviedb.org/3`. It loads the Vite public variable `VITE_TMDB_API_KEY` and adds its value as `api_key` to every request URL. The browser directly sends GET via native `fetch(url)` and the app adds no custom headers. Every row below includes `api_key`.

| Function and lines | Endpoint | Parameters beyond authentication | Use and result |
|---|---|---|---|
| `discoverMovies(filters)`, 55–77 | GET `/discover/movie` | `language=en-US`, `page=1`, `sort_by=popularity.desc`, optional `with_genres` and `primary_release_year` | Home default and filtered browsing. Returns `data.results`. |
| `searchMovies(query)`, 39–53 | GET `/search/movie` | Raw `query`, `language=en-US`, `page=1` | Home title search. Returns `data.results`. |
| `fetchGenres()`, 80–93 | GET `/genre/movie/list` | `language=en` | Home's genre options. Returns `data.genres`. |
| `fetchMovieById(movieId)`, 22–36 | GET `/movie/{movie_id}` | Path ID, `language=en-US`, `append_to_response=credits` | Details and unused prototype. Returns the full object with credits; there is no separate credits request. |
| `fetchPopularMovies()`, 6–20 | GET `/movie/popular` | `language=en-US`, `page=1` | Unused exported helper. Returns `data.results`. |

Home displays Discover sorted by popularity under “Popular Movies.” Genre and year are sent to TMDB together when present. The genre label is localized display text and the value is an ID. Year uses a number input and a truthiness check with no completed-year validation. There is no local list filtering or sort control. The English locale localizes returned data. No explicit origin-country, original-language, or region filter is supplied. Discover and Search normally rely on the provider's default adult exclusion. The raw search interpolation does not protect the query string against reserved delimiters.

Any nonempty query, including whitespace, switches Home to Search. No debounce, trim, submit requirement, result deduplication, or latest-request guard exists. Filters are hidden while searching and cannot constrain Search. Clearing search reactivates existing filters during the same Home mount. Navigating away discards local Home state.

A list response ordinarily includes `page`, `results`, `total_pages`, and `total_results`. The wrappers discard everything except `results` and hardcode page 1. Home renders the returned array without slicing. Filters and search can query different subsets of TMDB, but the app cannot load later results from any one query. TMDB documents allowed page numbers from 1 to 500. This limit describes pages per query and cannot establish the catalogue size. [TMDB pagination errors](https://developer.themoviedb.org/docs/errors)

All wrappers check `response.ok`, parse JSON, log failures, and return an empty array or, for Details, `null`. There is no schema validation, typed error, timeout, cancellation, retry, application cache, or rate-limit handling. Home's `isLoading` is assigned but the template checks `movies.length === 0`. Detail uses a null test. Empty or failed responses can therefore appear to load indefinitely. Prior cards remain visible during a new list request, and older responses can overwrite newer results.

Card and Details posters concatenate the fixed `https://image.tmdb.org/t/p/w500` prefix with `poster_path`. There is no common URL helper, backdrop rendering, fallback or adaptive image sizing. See [Design system](DESIGN_SYSTEM.md#image-system).

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
- **Build and scripts** `npm run dev` runs Vite, `npm run build` runs `vite build` with default `dist/` output, and `npm run preview` serves built output locally. Existing `npm run deploy` runs the build then `gh-pages -d dist` for GitHub Pages.
- **Base and assets** Vite uses the default root base, router consumes `BASE_URL`, and favicon is root-relative. A repository-subpath GitHub Pages host would need base and deep-link handling.
- **Production routing** The preceding audit observed HTTP 200 at `/` and HTTP 404 on direct GETs of `/favorites`, `/movie/550` and an unknown path. No repository `vercel.json` or equivalent SPA fallback was found. In-app navigation can work once the shell is loaded. Refreshes and links opened directly suffer the hosting failure.
- **Environment** The current client build needs `VITE_TMDB_API_KEY`. Vite substitutes client-exposed values into JS. The prior audit confirmed the public Vercel bundle contained the exact locally configured value, using in-memory comparison. This is a confirmed exposure. HTTPS and local ignore rules do not remove that frontend visibility.
- **Headers and metadata** Previous public checks found HSTS on the homepage and no CSP. The homepage had the starter title, empty HTML language, and no description, canonical or Open Graph data. `/robots.txt` and `/sitemap.xml` returned 404. There is no SSR or prerender setup.
- **Unverified** Vercel dashboard build settings, Node version, environment scopes and origin, deployed source revision, deployment automation, and possible GitHub Pages usage. The previously observed production entry JS differed from the existing local artifact. The production CSS and favicon matched the local artifacts in that audit.

## Technical debt register

| ID | Classification | Evidence and impact | Relevant source |
|---|---|---|---|
| T01 | Confirmed security exposure | Public credential can be reused according to its permissions. Actual abuse and account scope remain unverified. | moviesApi lines 1–3 and URL builders |
| T02 | Confirmed production defect | Known HTML5 routes return server 404 on direct request. | router lines 6–26 and absent fallback |
| T03 | Confirmed state defect | Empty and failed lists/details appear to be loading. Genre failures leave the default option alone. | Home lines 21–36,63–68, Detail lines 19–28, moviesApi |
| T04 | Confirmed request design defect | Raw search text can change query syntax. Overlapping effects can commit responses out of order. | Home lines 21–36, moviesApi lines 39–43 |
| T05 | Confirmed navigation limitation | Search is global to edit and Home-only to view. A reused detail route does not fetch a changed ID. | AppHeader lines 25–33, Home lines 21–36, Detail lines 10–20 |
| T06 | Confirmed persistence limitation | Invalid local data or denied writes can fail. Stored snapshots can grow stale. TV ID collisions would arise with numeric-only identity. | favoritesStore lines 14–37 |
| T07 | Architectural limitation | One page per result set, no caching, cancellation, deduplication or request policy. | moviesApi lines 6–93 and Home effect |
| T08 | Maintenance issue | Repeated Fetch and poster construction, unused popular method, prototype, unused store import/helper, Axios and inactive Tailwind 4 adapters. | moviesApi, MovieCard, MovieDetailView, testView, favoritesStore, package.json |
| T09 | Missing quality infrastructure | No local test suite, mocks, type/lint/format scripts or CI workflow. Dashboard checks unverified. | package.json and tree |
| T10 | Confirmed input/data gaps | Incomplete year edits can fetch. Null or malformed data can break details rating or cast and produce broken image URLs. | Home lines 56–59, Detail lines 33–75, moviesApi |
| T11 | Security hygiene | `*.local` covers the current env file. General `.env` and `.env.production` are not explicitly covered. Git tracking and history were unverified. | .gitignore lines 10–15 |
| T12 | Missing features | TV browsing/details, seasons, episodes, mixed search, advanced filters, later list pages, and route metadata are absent. | router, moviesApi, Home and Details |
| T13 | Unverified runtime risks | Potential breakpoint overflow, browser-specific storage behavior, dependency advisory coverage and live TMDB rate limits were not exercised. | [Design defects](DESIGN_SYSTEM.md#known-visual-defects-and-candidate-fixes), package-lock, platform |
| T14 | Confirmed layout and accessibility gaps | Non-growing main displaces the short-page footer. Nested landmarks, contrast and visible focus gaps remain. | App, routed views, header and card. See [Design system](DESIGN_SYSTEM.md). |

## Proposed architecture for later phases

The following options are pending implementation planning.

1. **Keep Vue, Vite, Tailwind and Pinia.** Improve the existing layers incrementally. JS can remain viable with runtime validation and checked contracts. Consider JSDoc or TypeScript at media, request and persistence boundaries if complexity warrants it.
2. **Consider a small Vercel Functions API.** Keep upstream credentials in a server-only variable. Allowlist endpoints, methods and relevant parameters. Validate requests, limit abuse, and cache eligible responses with bounded freshness. Serve app routes through a compatible Vercel SPA fallback. Plan credential replacement after browser traffic has moved off the exposed value.
3. **Share request handling.** Safely encode parameters, validate external response shapes, preserve list pagination metadata, support cancellation or last-request-wins, and expose independent pending, success, empty and error states. Use request controls and caching as appropriate. Discover across categories and pages without acquiring the entire catalogue in browser memory.
4. **Separate summaries from detail contracts.** Shared summaries can provide `mediaType`, source ID, display title/date, poster and rating. Map movie `title` and `release_date` and TV `name` and `first_air_date` intentionally. Keep movie runtime, TV season structures and episode details distinct. Any people search results need their own presentation contract.
5. **Keep existing movie URLs and share new resource routes.** Preserve `/movie/:id`. Candidate routes include `/tv/:id`, `/tv/:id/season/:seasonNumber` and `/tv/:id/season/:seasonNumber/episode/:episodeNumber`. Validate resource parameters, including valid season zero when applicable. Consider route query state for shareable search, filters and pages.
6. **Migrate favorites safely.** Introduce composite media identity, preserve existing movie order and useful display data, validate legacy entries and make migration retry-safe. Keep raw legacy data recoverable until a new write succeeds. Add accounts or database infrastructure only when explicitly approved requirements justify it.
7. **Introduce automated regression coverage.** Mock TMDB for response-state and race tests, check route ID changes and direct routes, guard favorite identity and persistence, and verify responsive and accessible workflows. Record actual validation outcomes in development reports.
