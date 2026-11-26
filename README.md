# MovieExplorer

MovieExplorer is a Vue 3 single-page app for movie discovery, search, details and browser-local favorites. See [architecture](ARCHITECTURE.md), the [current visual baseline](DESIGN_SYSTEM.md) and the [repository instructions](AGENTS.md).

## Local setup on Windows

Use Node `^20.19.0 || >=22.12.0`. For a fresh checkout, install the locked dependencies with `npm.cmd ci`. This uses the existing npm lockfile. The local API runs with Vite, without Vercel CLI or account linking.

From the repository root in PowerShell, enter the TMDB v3 API key at the masked prompt. Paste the value from your private TMDB account settings, then clear your clipboard if used. The key is scoped to the current PowerShell process and its child processes.

```powershell
$movieExplorerSecret = Read-Host 'TMDB v3 API key' -AsSecureString
try {
  $env:TMDB_API_KEY = [System.Net.NetworkCredential]::new('', $movieExplorerSecret).Password
  npm.cmd run dev
} finally {
  Remove-Item Env:TMDB_API_KEY -ErrorAction SilentlyContinue
  Remove-Variable movieExplorerSecret -ErrorAction SilentlyContinue
}
```

Open the localhost URL Vite prints. As an alternative, use the blank variable name in [.env.example](.env.example) to configure `TMDB_API_KEY` privately in an ignored `.env.development.local` file. Use an ignored `.env.production.local` or the same interactive shell method for `npm.cmd run preview`; the Vite preview command uses production mode by default. The app does not read the old public variable. Vite exposes no custom environment variables to client code. Existing local environment files are not migrated automatically.

```powershell
node --test
npm.cmd run build
```

Tests mock TMDB and need no key. Building also needs no key. To serve the build with the local API, run the interactive secret-entry block with `npm.cmd run preview` in place of `npm.cmd run dev`. Vite local preview verifies the compiled SPA and shared API handler. It does not execute Vercel rewrites.

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
