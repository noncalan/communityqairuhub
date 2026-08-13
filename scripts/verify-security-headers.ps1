$ErrorActionPreference = "Stop"

$stdoutPath = Join-Path $env:TEMP "qairu-phase3-server.out.log"
$stderrPath = Join-Path $env:TEMP "qairu-phase3-server.err.log"
$server = Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("start", "--", "-p", "3011") `
  -WorkingDirectory (Get-Location) `
  -WindowStyle Hidden `
  -PassThru `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath

try {
  $response = $null
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
      $response = Invoke-WebRequest `
        -Uri "http://127.0.0.1:3011/login" `
        -UseBasicParsing `
        -TimeoutSec 2
      break
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $response) {
    Get-Content -LiteralPath $stdoutPath -ErrorAction SilentlyContinue
    Get-Content -LiteralPath $stderrPath -ErrorAction SilentlyContinue
    throw "Production server did not become ready."
  }

  $csp = [string]$response.Headers["Content-Security-Policy"]
  $nonceMatch = [regex]::Match($csp, "'nonce-([^']+)'")
  $scriptNonces = [regex]::Matches(
    $response.Content,
    '<script[^>]+nonce="([^"]+)"'
  ) | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

  $checks = [ordered]@{
    Status = $response.StatusCode
    CspPresent = [bool]$csp
    CspHasStrictDynamic = $csp.Contains("'strict-dynamic'")
    CspBlocksUnsafeInlineScript = -not $csp.Contains(
      "script-src 'unsafe-inline'"
    )
    CspNoncePresent = $nonceMatch.Success
    ScriptNonceCount = @($scriptNonces).Count
    AllScriptNoncesMatch = @(
      $scriptNonces | Where-Object { $_ -ne $nonceMatch.Groups[1].Value }
    ).Count -eq 0
    NoSniff = $response.Headers["X-Content-Type-Options"] -eq "nosniff"
    FrameDenied = $response.Headers["X-Frame-Options"] -eq "DENY"
    ReferrerPolicy = $response.Headers["Referrer-Policy"] -eq "strict-origin-when-cross-origin"
    PermissionsPolicy = [bool]$response.Headers["Permissions-Policy"]
    Hsts = [bool]$response.Headers["Strict-Transport-Security"]
    PoweredByHidden = -not [bool]$response.Headers["X-Powered-By"]
    SharedCacheDisabled = -not (
      [string]$response.Headers["Cache-Control"]
    ).Contains("s-maxage")
  }

  $checks.GetEnumerator() | ForEach-Object {
    Write-Output "$($_.Key)=$($_.Value)"
  }
  $failed = $checks.GetEnumerator() | Where-Object {
    $_.Key -ne "Status" -and $_.Key -ne "ScriptNonceCount" -and -not $_.Value
  }
  if ($response.StatusCode -ne 200 -or $scriptNonces.Count -lt 1 -or $failed) {
    throw "One or more production security-header checks failed."
  }
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
  Get-NetTCPConnection -LocalPort 3011 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force }
}
