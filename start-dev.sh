#!/bin/bash
cd "$(dirname "$0")"

echo "Iniciando Study Analyzer..."

# Iniciar API em background
echo "Iniciando API (port 3001)..."
cd apps/api
npx tsx watch src/index.ts &
API_PID=$!
cd ../..

sleep 2

# Iniciar Web
echo "Iniciando Frontend (port 3000)..."
cd apps/web
npx next dev -p 3000 &
WEB_PID=$!

echo ""
echo "Acesse: http://localhost:3000"
echo "API:    http://localhost:3001"
echo ""

# Trap para encerrar ambos ao sair
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
