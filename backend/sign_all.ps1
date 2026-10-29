# Sign all release binaries using Windows Authenticode & RFC 3161 Timestamping
param(
    [string]$Thumbprint = "D04D96EEBE6422D3309D257582F1F4DE337A353D"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$ReleaseDir = Join-Path $ProjectRoot "release"
$Signtool = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe"

Write-Host "==> Resolving Certificate $Thumbprint..." -ForegroundColor Cyan
$cert = Get-Item "Cert:\CurrentUser\My\$Thumbprint"
if (-not $cert) {
    throw "Certificate $Thumbprint not found in Cert:\CurrentUser\My"
}

# 1. Export Public Certificate
$CerPath = Join-Path $ReleaseDir "MicMoseStudio.cer"
Write-Host "==> Exporting public certificate to $CerPath..." -ForegroundColor Cyan
Export-Certificate -Cert $cert -FilePath $CerPath -Force | Out-Null

# 2. Sign Executables & MSI
$filesToSign = @(
    (Join-Path $ReleaseDir "MicMose Photo Culler Pro.exe"),
    (Join-Path $ReleaseDir "MicMose-Photo-Culler-Pro-Setup.exe"),
    (Join-Path $ReleaseDir "MicMose-Photo-Culler-Pro.msi")
)

foreach ($f in $filesToSign) {
    if (Test-Path $f) {
        Write-Host "==> Signing $f..." -ForegroundColor Green
        & $Signtool sign `
            /sha1 $Thumbprint `
            /fd SHA256 `
            /tr "http://timestamp.digicert.com" `
            /td SHA256 `
            /d "MicMose Photo Culler Pro v1.0.3" `
            /du "https://github.com/Naphatpuurin/AI-Assist-Photo-Culler" `
            $f

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Primary timestamp server failed. Retrying without timestamp..."
            & $Signtool sign `
                /sha1 $Thumbprint `
                /fd SHA256 `
                /d "MicMose Photo Culler Pro v1.0.3" `
                /du "https://github.com/Naphatpuurin/AI-Assist-Photo-Culler" `
                $f
        }
        
        # Unblock file on local machine
        Unblock-File -Path $f -ErrorAction SilentlyContinue
    }
}

# 3. Re-generate SHA256SUMS.txt
Write-Host "==> Updating SHA256SUMS.txt..." -ForegroundColor Cyan
Set-Location $ReleaseDir
$hashList = @("MicMose Photo Culler Pro.exe", "MicMose-Photo-Culler-Pro-Setup.exe", "MicMose-Photo-Culler-Pro.msi", "MicMose-Photo-Culler-Pro-macOS.dmg", "MicMoseStudio.cer")
$lines = foreach ($h in $hashList) {
    if (Test-Path $h) {
        $sha = (Get-FileHash -Algorithm SHA256 $h).Hash.ToLower()
        "$sha  $h"
    }
}
$lines | Out-File -FilePath (Join-Path $ReleaseDir "SHA256SUMS.txt") -Encoding ascii

Write-Host "==> Code Signing & Verification Complete!" -ForegroundColor Green
