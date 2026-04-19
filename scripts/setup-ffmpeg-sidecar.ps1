param(
  [string]$DownloadUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$binaryDir = Join-Path $repoRoot "src-tauri\binaries"
$isWindowsVariable = Get-Variable -Name IsWindows -ValueOnly -ErrorAction SilentlyContinue
$isWindowsHost = ($env:OS -eq "Windows_NT") -or ($isWindowsVariable -eq $true)

if (-not $isWindowsHost) {
  throw "The FFmpeg sidecar setup script currently supports Windows only."
}

function Get-HostTuple {
  $rustc = Get-Command rustc -ErrorAction SilentlyContinue

  if ($rustc) {
    try {
      $tuple = (& rustc --print host-tuple 2>$null).Trim()
      if ($tuple) {
        return $tuple
      }
    } catch {
      # Older Rust versions do not support --print host-tuple.
    }

    $rustVersion = & rustc -Vv
    $hostLine = $rustVersion | Where-Object { $_ -like "host:*" } | Select-Object -First 1
    if ($hostLine) {
      return ($hostLine -replace "^host:\s*", "").Trim()
    }
  }

  $architecture = $env:PROCESSOR_ARCHITECTURE
  if ($architecture -eq "AMD64") {
    return "x86_64-pc-windows-msvc"
  }

  if ($architecture -eq "ARM64") {
    return "aarch64-pc-windows-msvc"
  }

  throw "Could not determine the Windows Rust target triple for architecture '$architecture'. Install Rust or pass through a supported Windows host."
}

$hostTuple = Get-HostTuple
$sidecarPath = Join-Path $binaryDir "ffmpeg-$hostTuple.exe"

if (Test-Path -LiteralPath $sidecarPath) {
  Write-Host "FFmpeg sidecar already exists: $sidecarPath"
  exit 0
}

New-Item -ItemType Directory -Force -Path $binaryDir | Out-Null

$tempDir = Join-Path ([IO.Path]::GetTempPath()) ("local-convert-ffmpeg-" + [Guid]::NewGuid().ToString("N"))
$archivePath = Join-Path $tempDir "ffmpeg-release-essentials.zip"

try {
  New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

  Write-Host "Downloading FFmpeg essentials build..."
  Invoke-WebRequest -Uri $DownloadUrl -OutFile $archivePath

  Write-Host "Extracting FFmpeg..."
  Expand-Archive -LiteralPath $archivePath -DestinationPath $tempDir -Force

  $ffmpeg = Get-ChildItem -Path $tempDir -Recurse -Filter "ffmpeg.exe" |
    Where-Object { $_.FullName -match "[\\/]+bin[\\/]+ffmpeg\.exe$" } |
    Select-Object -First 1

  if (-not $ffmpeg) {
    throw "Downloaded archive did not contain bin\ffmpeg.exe."
  }

  Copy-Item -LiteralPath $ffmpeg.FullName -Destination $sidecarPath -Force
  Write-Host "Installed FFmpeg sidecar: $sidecarPath"
} finally {
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
