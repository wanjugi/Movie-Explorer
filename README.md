# MovieExplorer

MovieExplorer is a Vue 3 single-page app for movie discovery, search, details and browser-local favorites. See [architecture](ARCHITECTURE.md), the [current visual baseline](DESIGN_SYSTEM.md) and the [repository instructions](AGENTS.md).

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

Use the [private-file PowerShell workflow above](#local-setup-on-windows) to run Vite. The global search field accepts Enter or commits a valid draft after 350 ms. Search from Home, Favorites or a movie detail page and confirm the address changes to `/?q=...`. Reopening that URL restores the result query. Validate punctuation and Unicode with a title such as `A & B + 雨`.

- Open `/?genre=28&year=2025` directly. Confirm both controls and the first-page discovery result request reflect the URL. A partial year such as `20` shows guidance and leaves the last committed year active. A valid year commits after 350 ms or Enter. Deleting the year clears it.
- Search from that filtered Home state, refresh, then select Clear. Genre and year return because the search URL retained them as paused filters. A new search from another page starts with no paused filters. Check browser Back and Forward, and confirm Enter on an already committed query does not add history or repeat a request.
- In DevTools, use network throttling and submit two different searches. Check that only the newer result remains even if the older response finishes later. While a request is pending, Home shows loading text. Try a title with no matches and use Clear search from the empty state.
- To exercise failure locally, switch the browser offline after loading the app, enter a different search, then restore the connection and select Retry movies. The retry should keep the same query. If genre loading fails independently, discovery should still render movies and Retry genres should be available.
- Open `/movie/550` and confirm details/credits. Add and remove a favorite on the same local origin and refresh Favorites. Use keyboard Tab and Enter to check the search form, Clear, retry and focus styling.

`npm.cmd test` runs the API, real Vue Router memory-history, debounce, request ownership, retry and Vite integration tests. The timing tests use Node's built-in mock timers. Live TMDB is only needed for the optional manual checks above.

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

`GET /api/movies` uses a required `operation` parameter. Supported values are `discover` (optional `genre` and `year`), `search` (required `query`), `genres`, `popular`, and `details` (required `id`). Requests validate input before reaching TMDB, use a fixed upstream, time out after eight seconds, and return safe JSON errors. All API responses use `Cache-Control: no-store`. See [architecture](ARCHITECTURE.md#tmdb-integration-and-request-behavior) for status mappings, routing and public API abuse limitations.
