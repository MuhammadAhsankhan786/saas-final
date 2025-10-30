#requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$NoServe
)

Write-Host "[fix-jwt] Clearing Laravel caches..." -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'

function Invoke-Artisan {
    param(
        [Parameter(Mandatory=$true)][string]$Command
    )
    Write-Host "[fix-jwt] php artisan $Command" -ForegroundColor DarkGray
    & php artisan $Command | Write-Output
}

try {
    Invoke-Artisan -Command "optimize:clear"
    Invoke-Artisan -Command "config:clear"
    Invoke-Artisan -Command "route:clear"
    Invoke-Artisan -Command "cache:clear"

    Write-Host "[fix-jwt] Rebuilding config cache..." -ForegroundColor Cyan
    Invoke-Artisan -Command "config:cache"

    if (-not $NoServe) {
        Write-Host "[fix-jwt] Starting Laravel dev server on http://127.0.0.1:8000 (use -NoServe to skip)" -ForegroundColor Green
        # Run server in foreground; caller can Ctrl+C to stop. If needed, use Start-Process for background.
        & php artisan serve
    } else {
        Write-Host "[fix-jwt] Skipping php artisan serve due to -NoServe flag" -ForegroundColor Yellow
    }
}
catch {
    Write-Error "[fix-jwt] An error occurred: $_"
    exit 1
}

exit 0


