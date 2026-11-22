$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location $root
$port = 20139
$url = "http://127.0.0.1:$port/login"

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js is required. Install Node.js 24 or 22.22.2+ and retry.'
  exit 1
}
if (-not (Test-Path (Join-Path $root 'node_modules/next/package.json'))) {
  Write-Host 'Project dependencies are missing. Run npm install in this workspace first.'
  exit 1
}
$listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback), $port
try {
  $listener.Start()
} catch {
  Write-Host "Port $port is already in use. Close the application using it and retry."
  exit 1
} finally {
  $listener.Stop()
}

$env:HOST = '127.0.0.1'
$env:PORT = "$port"
$env:DATA_DIR = Join-Path $root '_artifacts/antares-review-data'
$env:INITIAL_PASSWORD = 'AntaresReview2026!'
Write-Host "AntaresGateway review: $url"
Write-Host 'Login password on first launch: AntaresReview2026!'
Write-Host 'Keep this window open. Press Ctrl+C or close the window to stop.'
Write-Host 'The first start may take a minute.'

$browserJob = Start-Job -ArgumentList $url -ScriptBlock {
  param($address)
  for ($attempt = 0; $attempt -lt 120; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $address -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        Start-Process $address
        return
      }
    } catch { }
    Start-Sleep -Seconds 1
  }
}
try {
  & node.exe --max-old-space-size=8192 scripts/dev/run-next.mjs dev
  exit $LASTEXITCODE
} finally {
  Stop-Job $browserJob -ErrorAction SilentlyContinue
  Remove-Job $browserJob -Force -ErrorAction SilentlyContinue
}
