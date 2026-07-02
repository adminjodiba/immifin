# Starts local Next.js dev server + Cloudflare tunnel for dev.immifin.com webhooks.
# Local development only — does not change production configuration.

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$devPort = if ($env:IMMIFIN_DEV_PORT) { [int]$env:IMMIFIN_DEV_PORT } else { 3000 }
$tunnelName = if ($env:IMMIFIN_DEV_TUNNEL_NAME) { $env:IMMIFIN_DEV_TUNNEL_NAME.Trim() } else { "immifin-dev" }
$devUrl = "http://localhost:$devPort"
$tunnelUrl = if ($env:IMMIFIN_DEV_PUBLIC_URL) { $env:IMMIFIN_DEV_PUBLIC_URL.Trim() } else { "https://dev.immifin.com" }
$webhookUrl = "$tunnelUrl/api/webhooks/clerk"

function Write-Info([string]$Message) {
  Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
  Write-Host $Message -ForegroundColor Green
}

function Write-WarnLine([string]$Message) {
  Write-Host $Message -ForegroundColor Yellow
}

function Write-Err([string]$Message) {
  Write-Host $Message -ForegroundColor Red
}

function Stop-DevPortListeners {
  $ports = @($devPort, 3001, 3002)
  foreach ($port in $ports) {
    Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique |
      ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
      }
  }
}

function Get-CloudflaredCommand {
  $command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    "$env:ProgramFiles\Cloudflare\cloudflared\cloudflared.exe",
    "$env:ProgramFiles(x86)\Cloudflare\cloudflared\cloudflared.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\cloudflared.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Wait-ForDevServer([int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $listener = Get-NetTCPConnection -LocalPort $devPort -State Listen -ErrorAction SilentlyContinue |
      Select-Object -First 1

    if ($listener) {
      return $true
    }

    if ($devProcess.HasExited) {
      throw "Next.js dev server exited before port $devPort became available."
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

Write-Info "IMMIFIN local development startup"
Write-Host "Repository: $repoRoot"
Write-Host ""

$cloudflaredPath = if ($env:CLOUDFLARED_PATH) { $env:CLOUDFLARED_PATH.Trim() } else { Get-CloudflaredCommand }
if (-not $cloudflaredPath) {
  Write-Err "cloudflared was not found on PATH."
  Write-Host ""
  Write-Host "Install it, then open a new terminal and retry:"
  Write-Host "  winget install Cloudflare.cloudflared"
  Write-Host ""
  Write-Host "Or set CLOUDFLARED_PATH to the full path of cloudflared.exe."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Err "npm was not found on PATH."
  exit 1
}

$cloudflaredConfig = Join-Path $env:USERPROFILE ".cloudflared\config.yml"
$cloudflaredCert = Join-Path $env:USERPROFILE ".cloudflared\cert.pem"
if (-not (Test-Path $cloudflaredConfig) -and -not (Test-Path $cloudflaredCert)) {
  Write-WarnLine "Cloudflare tunnel credentials were not detected in $env:USERPROFILE\.cloudflared"
  Write-Host "Run once before using the dev tunnel:"
  Write-Host "  cloudflared tunnel login"
  Write-Host ""
}

Write-Info "Checking tunnel configuration..."
& $cloudflaredPath tunnel info $tunnelName | Out-Host
if ($LASTEXITCODE -ne 0) {
  Write-Err "Could not load tunnel '$tunnelName'."
  Write-Host ""
  Write-Host "Set IMMIFIN_DEV_TUNNEL_NAME if your tunnel uses a different name."
  Write-Host "Useful commands:"
  Write-Host "  cloudflared tunnel list"
  Write-Host "  cloudflared tunnel login"
  exit 1
}

Write-Info "Stopping existing listeners on ports $devPort, 3001, 3002..."
Stop-DevPortListeners

$devProcess = $null

try {
  Write-Info "Starting Next.js dev server (npm run dev)..."
  $devProcess = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -WindowStyle Hidden

  Write-Host "Waiting for $devUrl ..."
  if (-not (Wait-ForDevServer -TimeoutSeconds 90)) {
    throw "Timed out waiting for Next.js on port $devPort."
  }

  Write-Ok "Next.js is listening at $devUrl"
  Write-Host ""
  Write-Ok "Starting Cloudflare tunnel '$tunnelName'..."
  Write-Host "Public dev URL:  $tunnelUrl"
  Write-Host "Clerk webhook:   $webhookUrl"
  Write-Host ""
  Write-WarnLine "Press Ctrl+C to stop the tunnel and Next.js dev server."
  Write-Host ""

  & $cloudflaredPath tunnel run $tunnelName
}
finally {
  if ($devProcess -and -not $devProcess.HasExited) {
    Write-Host ""
    Write-Info "Stopping Next.js dev server..."
    Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
