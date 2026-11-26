param(
  [uri]$Origin = 'https://movie-explorer-nine-gilt.vercel.app'
)
$ErrorActionPreference = 'Stop'
if ($Origin.Scheme -ne 'https' -or $Origin.AbsolutePath -ne '/' -or $Origin.Query -or $Origin.Fragment) {
  throw 'Provide an HTTPS deployment origin without a path or query.'
}

$checks = @(
  foreach ($path in @('/', '/movies', '/tv', '/search?q=Sintel&type=people', '/favorites', '/movie/550',
    '/tv/33050', '/tv/33050/season/1', '/tv/33050/season/1/episode/1', '/person/31',
    '/collection/10', '/library', '/calendar', '/watch/movie/10378',
    '/watch/tv/33050/season/1/episode/1', '/?q=Sintel', '/?genre=28')) {
    @{ Path = $path; Status = 200; Type = 'text/html' }
  }
  @{ Path = '/theme-preference.js'; Status = 200; Type = 'javascript' }
  @{ Path = '/movie-explorer.svg'; Status = 200; Type = 'image/svg+xml' }
  foreach ($query in @('discover', 'search&query=Sintel', 'genres', 'popular', 'trending&period=week', 'top-rated',
    'now-playing', 'upcoming', 'details&id=550', 'videos&id=550', 'person-search&query=Tom%20Hanks',
    'person&id=31', 'collection&id=10', 'recommendations&id=550', 'similar&id=550',
    'providers&id=550', 'calendar&from=2025-01-01&to=2025-01-31')) {
    @{ Path = "/api/movies?operation=$query"; Status = 200; Type = 'application/json' }
  }
  foreach ($query in @('discover', 'search&query=Pioneer%20One', 'multi-search&query=Pioneer%20One', 'genres',
    'popular', 'trending&period=week', 'top-rated', 'airing-today', 'on-the-air', 'details&id=33050',
    'season&id=33050&season=1', 'episode&id=33050&season=1&episode=1', 'videos&id=33050',
    'recommendations&id=1399', 'similar&id=1399', 'providers&id=1399',
    'calendar&from=2025-01-01&to=2025-01-31')) {
    @{ Path = "/api/tv?operation=$query"; Status = 200; Type = 'application/json' }
  }
  @{ Path = '/api/movies?operation=details&id=0'; Status = 400; Type = 'application/json' }
  @{ Path = '/api/tv?operation=details&id=1&id=2'; Status = 400; Type = 'application/json' }
  @{ Path = '/api/tv?operation=unknown'; Status = 404; Type = 'application/json' }
  @{ Path = '/api/__movieexplorer_invalid'; Status = 404 }
  @{ Path = '/api/movies?operation=genres'; Status = 405; Type = 'application/json'; Method = 'POST' }
)
$failures = 0
foreach ($check in $checks) {
  $method = if ($check.Method) { $check.Method } else { 'GET' }
  $url = [uri]::new($Origin, $check.Path).AbsoluteUri
  $result = curl.exe --silent --show-error --max-time 20 --output NUL --write-out '%{http_code}|%{content_type}' --request $method $url
  $curlExit = $LASTEXITCODE
  $status, $contentType = "$result" -split '\|', 2
  $matched = $curlExit -eq 0 -and $status -eq "$($check.Status)" -and
    (!$check.Type -or $contentType -like "*$($check.Type)*")
  if (!$matched) { $failures++ }
  $label = if ($matched) { 'PASS' } else { 'FAIL' }
  "$label $method $($check.Path) $status (expected $($check.Status))"
}
if ($failures) { throw "$failures of $($checks.Count) HTTP checks failed. Investigate before announcing the release." }
"All $($checks.Count) HTTP checks passed. Verify playback and browser behavior separately."
