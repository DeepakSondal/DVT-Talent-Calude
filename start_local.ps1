# ==============================================================================
# DVT Talent AI - Local Startup Script (DOCKERIZED)
# ==============================================================================
Write-Host "Starting DVT Talent AI Full Docker Setup..." -ForegroundColor Green

$projectRoot = $PSScriptRoot

# 1. Environment Configuration
$envSource = Join-Path $projectRoot "backend\.env.example"
$envTarget = Join-Path $projectRoot "backend\.env"

if (-not (Test-Path -Path $envTarget)) {
    Write-Host "Copying backend/.env.example to backend/.env..." -ForegroundColor Yellow
    Copy-Item -Path $envSource -Destination $envTarget
} else {
    Write-Host "backend/.env already exists." -ForegroundColor Gray
}

# 2. Revert any manual changes to localhost so it works inside docker mesh
Write-Host "Ensuring .env is configured for Docker networking..." -ForegroundColor Yellow
$envContent = Get-Content $envTarget
$envContent = $envContent -replace "localhost:5432", "postgres:5432"
$envContent = $envContent -replace "localhost:6379", "redis:6379"
$envContent = $envContent -replace "CHROMA_HOST=localhost", "CHROMA_HOST=chromadb"
Set-Content -Path $envTarget -Value $envContent

# 3. Build & Run everything via Docker (Frontend, Backend, Workers, Database)
Write-Host "`nBuilding and starting all services via Docker (this avoids Windows Python/Node build errors)..." -ForegroundColor Yellow

# Shut down any existing partial containers
docker compose down

# Spin up everything (frontend, api, worker, databases)
docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError: Docker failed to build or start. Please ensure Docker Desktop is running." -ForegroundColor Red
    Write-Host "`n--- API LOGS ---" -ForegroundColor Yellow
    docker logs dvt-api
    exit 1
}

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "SUCCESS! All services are spinning up in the background." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "Frontend Dashboard : http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API Docs   : http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "`nYou can view the logs by running: docker compose logs -f" -ForegroundColor Yellow
