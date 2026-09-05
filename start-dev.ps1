Write-Host "Iniciando Study Analyzer..." -ForegroundColor Cyan
Write-Host ""

# Iniciar API em background
Write-Host "Iniciando API (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\api'; npx tsx watch src/index.ts" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Iniciar Web
Write-Host "Iniciando Frontend (port 3000)..." -ForegroundColor Green
Write-Host ""
Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API:    http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

Set-Location "$PSScriptRoot\apps\web"
npx next dev -p 3000
