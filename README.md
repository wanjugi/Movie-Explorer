# MovieExplorer

MovieExplorer is a cinematic Vue 3 application for discovering movies and TV series, exploring seasons and episodes, and keeping a personal Library. It combines Vite, Vue Router, Pinia, Tailwind CSS 3 and two same-origin Vercel Functions that request metadata from TMDB.

[Live site](https://movie-explorer-nine-gilt.vercel.app/) · [Architecture](ARCHITECTURE.md) · [Design system](DESIGN_SYSTEM.md) · [Changelog](CHANGELOG.md)

## Features

- Open **Live TV** to browse Kenyan and selected international stations, filter the guide, visit broadcaster profiles, favorite stations and share channel links. Supported public YouTube broadcasts play after activation. Other stations link to their official viewing options. See [Live TV sources](LIVE_TV_SOURCES.md).

### Optional current Live TV discovery

In [Google Cloud Console](https://console.cloud.google.com/), create or select a project. In **APIs & Services → Library**, enable **YouTube Data API v3**. In **Credentials**, create an API key and restrict its permitted API to **YouTube Data API v3**. This key is used by the server. Browser referrer restrictions do not fit this server-side request path.

Add `YOUTUBE_DATA_API_KEY` privately to your local `.env.local` and restart Vite. The Vite API adapter reads .env.local directly using loadEnv at startup. The PowerShell block below starts both APIs; the YouTube key requires no separate export. For deployment, add the same server-only variable under **Vercel → Project → Settings → Environment Variables** for the desired Preview or Production scopes. An owner-managed deployment is required to apply it. Keep the value out of browser-prefixed variables, screenshots and public files.

Without a key, approved NTV Kenya, Al Jazeera English, France 24 English, KTN and BBC News fixed sources may play while eligible. Fixed playback also handles temporary resolver and quota failures when there is no confirmed rejection, player failure or expiry for that source. KBC and CGTN Africa require the key for on-demand discovery. After configuring the key, verify KTN, the two KBC channels, BBC?s regional feed and CGTN Africa around 13:00 or 20:00 Nairobi time. Authenticated discovery has been exercised with deterministic fixtures only. Google's documentation currently lists 100 daily `search.list` calls in a separate quota bucket. Metadata checks use `videos.list` first to conserve the search pool. [YouTube quotas](https://developers.google.com/youtube/data/determine_quota_cost)

- Explore People search, cast and crew profiles, filmographies, collections, related titles, and a release calendar.
- Check country-specific JustWatch availability through TMDB. Kenya is the default, and the country can be changed locally.
- Open the Library from Favorites to access Watchlist, Recently Viewed, Watched, Continue Watching and optional seed-based recommendations. Library records and Favorites are stored separately in the browser.
- Watch specifically approved full-length works through YouTube. [Playback sources](PLAYBACK_SOURCES.md) identifies the exact film and episode, creator and source. Trailer playback and external availability have separate controls. Full-title playback depends on the provider's embedding, network and regional restrictions.

The v1.1.0 release is prepared locally. Phase 9B dynamic movie streaming integration was deliberately skipped.

## Release and maintenance

Use `npm.cmd run verify` before an owner-managed release. After deployment, run `powershell -NoProfile -File .\scripts\verify-production.ps1` from the repository root. It issues read-only HTTP checks for SPA routes, static assets, and API operations. Verify browser behavior and actual video playback separately.

The browser stores Favorites, Library, and preferences locally. The app uses TMDB metadata and artwork, regional JustWatch availability through TMDB, and YouTube playback for trailers and selected titles. Server handlers validate inputs and keep `TMDB_API_KEY` private. The public metadata API does not implement a global rate limiter.

For maintenance, use the lockfile with `npm.cmd ci`, run both npm audit variants, and repeat verification after changes. If TMDB requests fail consistently, check the server-only key and TMDB status. If an embed fails, check the authorized source and provider status. The app uses client-side routing. Social previews share the static site description because crawlers may skip JavaScript.

## Local setup on Windows

Use Node `^20.19.0 || >=22.12.0`. For a fresh checkout, install the locked dependencies with `npm.cmd ci`. This uses the existing npm lockfile. The local API runs with Vite, without Vercel CLI or account linking.

From the repository root in PowerShell, use the following block to start Vite with the key already in your private `.env.local`. It prefers `TMDB_API_KEY` and temporarily supports the legacy name as a local migration fallback. It passes the selected value only to the server process environment and restores the session's prior state when Vite stops.

```powershell
$movieExplorerPreviousKey = $env:TMDB_API_KEY
try {
  $movieExplorerValues = @{}
  foreach ($movieExplorerLine in (Get-Content -LiteralPath .env.local -ErrorAction SilentlyContinue)) {
    $movieExplorerMatch = [regex]::Match($movieExplorerLine, '^\s*(?:export\s+)?(TMDB_API_KEY|VITE_TMDB_API_KEY)\s*=\s*(.*?)\s*$')
    if ($movieExplorerMatch.Success) {
      $movieExplorerName = $movieExplorerMatch.Groups[1].Value
      $movieExplorerValues[$movieExplorerName] = ($movieExplorerMatch.Groups[2].Value -replace '\s+#.*$').Trim().Trim([char[]]@('"', "'"))
    }
  }
  $movieExplorerKey = $movieExplorerValues['TMDB_API_KEY']
  if (-not $movieExplorerKey) { $movieExplorerKey = $movieExplorerValues['VITE_TMDB_API_KEY'] }
  if (-not $movieExplorerKey) { $movieExplorerKey = $movieExplorerPreviousKey }
  if (-not $movieExplorerKey) { throw 'Configure TMDB_API_KEY in your private .env.local before starting Vite.' }
  $env:TMDB_API_KEY = $movieExplorerKey
  npm.cmd run dev
} finally {
  if ($null -eq $movieExplorerPreviousKey) {
    Remove-Item Env:TMDB_API_KEY -ErrorAction SilentlyContinue
  } else {
    $env:TMDB_API_KEY = $movieExplorerPreviousKey
  }
  Remove-Variable movieExplorerPreviousKey,movieExplorerValues,movieExplorerLine,movieExplorerMatch,movieExplorerName,movieExplorerKey -ErrorAction SilentlyContinue
}
```

Open the localhost URL Vite prints. If `.env.local` already defines `TMDB_API_KEY`, plain `npm.cmd run dev` also works. See [.env.example](.env.example) for the private variable name. Use `npm.cmd run preview` to serve an existing build with the same API, or substitute that command in the block above. Vite preview uses production mode by default. The app and Vercel function read only the server variable. The legacy name is accepted solely by the local PowerShell block. If the old credential was revoked, use a valid current server key in your private configuration.

## Development commands

| Command | Purpose |
|---|---|
| `npm.cmd run dev` | Local Vite server with the shared movie API |
| `npm.cmd run build` | Production client build |
| `npm.cmd run preview` | Serve built assets with the local API |
| `npm.cmd test` | Node tests with mocked TMDB, including local route and client isolation checks |
| `npm.cmd run verify` | Run tests and then build |
| `npm.cmd run deploy` | Legacy GitHub Pages publish command, retained pending owner confirmation. Use the owner-managed Vercel workflow for the current app. |

Tests and build require no TMDB key. The integration test uses an ephemeral loopback port and synthetic values. Vite preview uses its own routing, so verify Vercel rewrites on a deployment during the owner-managed release.

## Movie search and filter verification

Use the [private-file PowerShell workflow above](#local-setup-on-windows) to run Vite. The global search field accepts Enter or commits a valid draft after 350 ms. Search from any page and confirm the address changes to `/search?q=...`. Reopening that URL restores the result query. Validate punctuation and Unicode with a title such as `A & B + 雨`. Home and Movies also have a separate movie-only field that keeps catalogue filters and category paused until the query is cleared.

- Open `/?genre=28&year=2025` directly. Confirm both controls and the first-page discovery result request reflect the URL. A partial year such as `20` shows guidance and leaves the last committed year active. A valid year commits after 350 ms or Enter. Deleting the year clears it.
- Search from that filtered Home state, refresh, then select Clear. Genre and year return because the search URL retained them as paused filters. A new search from another page starts with no paused filters. Check browser Back and Forward, and confirm Enter on an already committed query does not add history or repeat a request.
- In DevTools, use network throttling and submit two different searches. Check that only the newer result remains even if the older response finishes later. Both Search and Home show skeleton cards and announce loading. Try a title with no matches and use the header Clear button.
- To exercise failure locally, switch the browser offline after loading the app, enter a different search, then restore the connection and select Retry movies. The retry should keep the same query. If genre loading fails independently, discovery should still render movies and Retry genres should be available.
- Open `/movie/550` and confirm details/credits. Add and remove a favorite on the same local origin and refresh Favorites. Use keyboard Tab and Enter to check the search form, Clear, retry and focus styling.

`npm.cmd test` runs the API, real Vue Router memory-history, debounce, request ownership, retry and Vite integration tests. The timing tests use Node's built-in mock timers. Live TMDB is only needed for the optional manual checks above.

## Phase 8B cinematic refinement

The header theme button switches between dark and light and remembers the explicit theme in the browser. Cinematic artwork stays locally dark in both themes. Cards and season posters lift with fine-pointer hover or keyboard focus, with static emphasis under reduced motion.

Watch trailer on the featured title, a movie, or a TV series opens a dialog and retrieves trailer metadata from the existing same-origin API. **Load YouTube trailer** deliberately loads a third-party player. Native controls start video playback. Some titles are unavailable or cannot embed, and a supported video's external link remains available when blocked. Privacy-enhanced embedding still contacts YouTube.

**Auto-preview trailers** on Home defaults off. Enabling it allows a muted preview after one second over the featured Watch trailer control on a wide fine-pointer desktop, when reduced motion is off. Manual playback remains the mobile and keyboard path. Browser autoplay policies can require Play inside the player.

Run `npm.cmd run verify` before owner deployment. Use an isolated browser profile for manual theme persistence, focus, rail boundaries, trailer lifecycle and both color schemes. The existing [PowerShell startup workflow](#local-setup-on-windows) is unchanged. Phase 8B remains local. Live playback eligibility can vary by title, browser and region.

## Phase 8 cinematic experience

Phases 5–8 are implemented locally and await owner deployment. The production site may show the earlier interface. Use the same [private-file PowerShell workflow](#local-setup-on-windows) for local startup.

- Open `/` for the featured carousel, global search, and real movie and TV collections. Use the arrow and pause controls, then try a shelf’s View all link.
- Open `/?q=Interstellar&genre=28` to verify that legacy movie-only search resolves to `/movies?q=Interstellar&genre=28`. Clearing the search stays on Movies and resumes the paused genre. Bare `/movies` and `/tv` keep their catalogue controls.
- Open a movie and TV title. From the TV season gallery follow a season and an episode. Verify parent links, actual adjacent numbering and missing-artwork fallbacks. Try the new cards and collection controls with keyboard focus and system reduced motion enabled.
- Test Favorites using a separate browser profile or synthetic data. The legacy and v2 storage contracts are unchanged.

See [the Phase 8 design baseline](DESIGN_SYSTEM.md) for palette, components, responsive behavior and motion. Broader Phase 4C, 4D and 4E remain deferred. Phase 10 covers final verification and deployment.

## Phase 5 visual acceptance

Use the same local startup block above. Check the footer on short and long Home, Favorites and Details pages. Compare the catalogue grid at compact phone, tablet, laptop and wide desktop widths with zero, one and many items. Throttle requests to see skeletons, try an empty search, and test a temporary API failure and Retry. Check image fallback, long titles, the keyboard focus outline, reduced motion and the new tab icon. For the implemented sizes, controls and palette, see the [design system](DESIGN_SYSTEM.md).

Phases 4C, 4D and 4E remain deferred. This phase covers the visual foundations and targeted accessibility fixes. The full cinematic redesign remains a later phase.

## Phase 7 movie and TV catalogue

Phases 5, 6 and 7 are implemented locally. Deployment remains owner-managed. Use the same [PowerShell startup block](#local-setup-on-windows) and server-only credential for both APIs.

| Open | What to verify |
|---|---|
| `/movies` or `/?q=Interstellar` | Dedicated movie catalogue and backward-compatible movie search |
| `/tv?from=1990&to=1999&sort=rating` | Discover TV by first-air years and rank by rating |
| `/tv?category=trending&period=day` | Daily Trending. Weekly is the default. Each period is one provider window. |
| `/search?q=Avatar&type=tv&page=2` | TV-only search with paging. Omit `type` for mixed titles or use `type=movie` for movie-only search. |
| `/tv/1399/season/1/episode/1` | Shareable episode URL. Series and season pages have their own links. |
| `/favorites?type=tv` | Local TV favorites. Remove `type` for all favorites. |

TV Discover supports TV genre, first-air year or range, original language, minimum rating and votes, and catalogue sorting. Other TV feeds pause Discover filters. TMDB multi-search may report people and other excluded records in its totals. Pages show only eligible movie and series titles and are never backfilled by fetching later pages.

Valid legacy movies load from `favoritesList` when `favoritesList:v2` is absent. The first successful change writes a versioned collection while preserving the original key. Movie IDs and TV IDs can overlap. For acceptance testing of migration and write failures, use an isolated browser profile and synthetic storage, or run `node --test test/favorites-storage.test.js`. An older build uses the legacy movie snapshot and ignores subsequent v2 changes.

Run `npm.cmd test` and `npm.cmd run build` for local checks. Before owner deployment, exercise the example URLs, Back/Forward, direct refresh, Specials, nonconsecutive neighbors, images with missing artwork, and shared movie and TV favorites in an isolated browser. Phases 4C, 4D and 4E remain deferred apart from the migration safeguards in this phase. Phase 8 is the cinematic redesign, Phase 9 advanced discovery, and Phase 10 final verification and deployment.

## Phase 6 movie catalogue

Phase 5 and Phase 6 are implemented locally. The owner's production deployment is separate. Keep using the same [PowerShell startup block](#local-setup-on-windows).

| Example URL | Behavior |
|---|---|
| `/?page=2` | Second page of default popularity-sorted Discover |
| `/?q=Interstellar&page=2` | Second page of title search |
| `/?category=top-rated&page=5` | Fifth page of TMDB Top Rated |
| `/?category=trending&period=day` | Official daily Trending. Weekly is the default. |
| `/?genre=28&year=1999&page=2` | Exact-year and genre discovery |
| `/?from=1980&to=1989&language=ko&rating=7&sort=rating` | Inclusive year range, Korean original language and minimum rating |

Discover also supports minimum votes, a runtime range, and sorting by popularity, average rating, votes, newest or oldest primary release, or revenue. Use Advanced filters and sort to apply staged edits. Applying a date range replaces an exact year, and entering a valid exact year clears the range. Release filters refer to primary release dates. Search and official feeds do not apply Discover filters. Clearing a search returns to the previous Home category and filter state on page one.

Use the numbered page controls or Go to page. Changes to the query, filters, or list reset to page one. Refresh and Back/Forward preserve the state recorded in the URL. TMDB limits paginated requests to 500 pages, or roughly 10,000 provider results at 20 per page. Some queries have fewer results and official feed totals can include entries omitted by the app's adult-content policy. Trending uses the documented one-page-per-period contract. Refine criteria to see different slices of the catalogue.

For local acceptance, open the examples, change filters while on a later page, navigate via Back/Forward, and try an out-of-range page on a narrow query. Verify that failed requests can be retried and old responses never replace newer results. Check mobile layouts and keyboard focus. The phase used a build and focused mocked tests. Comprehensive frontend and owner-deployed verification remain deferred. Phase 4C, 4D and 4E remain deferred.

## Dependency maintenance

Phase 3C removed unused Axios and both unused Tailwind 4 adapters. The app stays on Vue 3.5, Vite 7, Tailwind 3, and PostCSS 8. Compatible security updates and the browser data refresh cleared the npm audit findings and stale compatibility warnings at verification time. See [the dependency record](ARCHITECTURE.md#phase-3c-dependency-maintenance) for versions and decisions.

```powershell
npm.cmd audit
npm.cmd audit --omit=dev
npx.cmd update-browserslist-db@latest
npm.cmd run verify
```

The Browserslist updater refreshes its data in the lockfile. Keep the data packages transitive and review the lockfile and generated CSS when updating. No component or browser test framework is installed. Phase 4 can evaluate Vitest and Vue Test Utils when component work begins.

## Owner migration and deployment checklist

1. Set the server-only key locally as above. From the local app, try initial discovery, genre and year independently and together, a punctuation-rich search, details with cast, and the poster images. On the same localhost origin, add and remove a favorite, refresh, and confirm retained favorites. Open `/favorites` and `/movie/550` directly and exercise Back/Forward.
2. In Vercel Project Settings → Environment Variables, create `TMDB_API_KEY` for the intended environments. Include Preview if you use one for verification, and Production for release. Check the Vite preset, supported Node version, `npm run build` and `dist` output. Use the repository's `vercel.json`.
3. Publish the approved revision through your existing owner-managed Vercel workflow. Preview first if available. `npm run deploy` is the old GitHub Pages command and is outside this Vercel workflow.
4. Verify the actual preview or production domain. For the production domain, the following PowerShell example prints only HTTP statuses and content types.

```powershell
$movieExplorerOrigin = 'https://movie-explorer-nine-gilt.vercel.app'
$movieExplorerPaths = @(
  '/',
  '/favorites',
  '/movie/550',
  '/favicon.ico',
  '/api/movies?operation=discover',
  '/api/movies?operation=discover&genre=28&year=1999',
  '/api/movies?operation=search&query=Star%20Wars',
  '/api/movies?operation=genres',
  '/api/movies?operation=popular',
  '/api/movies?operation=details&id=550',
  '/api/movies?operation=details&id=invalid',
  '/api/unknown'
)
foreach ($movieExplorerPath in $movieExplorerPaths) {
  curl.exe -sS -o NUL -w "%{http_code} %{content_type} $movieExplorerPath`n" "$movieExplorerOrigin$movieExplorerPath"
}
```

5. Expect HTML 200 for the three app routes, a working favicon and referenced JS/CSS, JSON 200 for valid API calls given a working upstream, JSON 400 for the invalid ID, and a host 404 for the unknown API path. API requests must never return the SPA document. In a browser, open and refresh Favorites and Details in new tabs, verify movie/genre/cast data, and verify existing favorites on the same production origin.
6. In DevTools Network, confirm movie metadata goes to `/api/movies` and poster requests go to `image.tmdb.org`. Load Favorites to include its lazy chunk. Run the asset check below for each public JS asset and any published source map referenced by it. Enter only same-origin asset URLs at the asset prompt and use the masked prompts for credential values.
7. After the secure release passes verification, remove the obsolete `VITE_TMDB_API_KEY` dashboard variable from the relevant scopes and remove the old entry from any private local env file when it is no longer needed. Environment changes apply to new deployments. Old deployments or cached assets may still contain the old credential. Removing the variable is separate from revocation.
8. In TMDB account API settings, use the supported replacement or revocation process for your account, if available. If the dashboard offers no suitable option, use TMDB's official support to request replacement or revocation. If both keys can overlap, validate the replacement locally and in Vercel before revoking the old key. If regeneration immediately invalidates the old key, schedule the cutover so you can update `TMDB_API_KEY` and deploy promptly. [TMDB application authentication](https://developer.themoviedb.org/docs/authentication-application)
9. Verify the replacement with the live API and app after a fresh deployment. Confirm the old key has been invalidated through TMDB's supported process without publishing it. If release verification fails, pause promotion, inspect safe function statuses and project configuration, and restore a known-good **secure** deployment once available. Re-serving the pre-phase build reintroduces public key exposure and deep-link failures. Once the old key is revoked, that build also cannot authenticate. Keep the previous working secure server credential available only through the private account settings during replacement when overlap is supported.

### Private check of deployed JS and source maps

Use the same `$movieExplorerOrigin` as the HTTP checks. Supply the public JS/map URLs separated by spaces. This scans their contents in memory and reports only counts. Expect zero matching assets and zero skipped assets.

```powershell
$movieExplorerAssets = (Read-Host 'Public JS and source-map URLs') -split '\s+'
$movieExplorerOld = Read-Host 'Previously public TMDB key' -AsSecureString
$movieExplorerNew = Read-Host 'Current server TMDB key' -AsSecureString
try {
  $movieExplorerNeedles = @(
    [System.Net.NetworkCredential]::new('', $movieExplorerOld).Password
    [System.Net.NetworkCredential]::new('', $movieExplorerNew).Password
    'VITE_TMDB_API_KEY'
    'TMDB_API_KEY'
    'api.themoviedb.org'
  ) | Where-Object { $_ }
  $movieExplorerScanned = 0
  $movieExplorerMatched = 0
  $movieExplorerSkipped = 0
  foreach ($movieExplorerAsset in $movieExplorerAssets) {
    try {
      $movieExplorerUri = [uri]::new([uri]$movieExplorerOrigin, $movieExplorerAsset)
      if ($movieExplorerUri.GetLeftPart([UriPartial]::Authority) -ne $movieExplorerOrigin -or
          $movieExplorerUri.AbsolutePath -notmatch '\.(m?js|map)$') {
        $movieExplorerSkipped++
        continue
      }
      $movieExplorerContent = (Invoke-WebRequest -Uri $movieExplorerUri -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop).Content
      if ($movieExplorerNeedles | Where-Object { $movieExplorerContent.Contains($_) }) { $movieExplorerMatched++ }
      $movieExplorerScanned++
    } catch {
      $movieExplorerSkipped++
    }
  }
  "Assets scanned: $movieExplorerScanned, matching: $movieExplorerMatched, skipped: $movieExplorerSkipped"
} finally {
  Remove-Variable movieExplorerOld,movieExplorerNew,movieExplorerNeedles,movieExplorerContent -ErrorAction SilentlyContinue
}
```

## API operations

`GET /api/movies` supports Discover, title search, genres, Popular, Trending, Top Rated, Now Playing, Upcoming, details, videos, people and collections. `GET /api/tv` supports its series catalogue, combined search, series, season and episode metadata, and videos. Both endpoints also serve recommendations, similar titles, watch-provider availability and calendar results. Requests use a fixed upstream, time out after eight seconds, and return safe JSON errors with `Cache-Control: no-store`. The [production check](scripts/verify-production.ps1) documents parameter examples.
