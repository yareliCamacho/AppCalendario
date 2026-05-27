@echo off
cd /d "%~dp0"
echo Reorganizando monorepo (frontend + backend)...
node monorepo-split.mjs
if exist package-lock.json move /Y package-lock.json frontend\package-lock.json
if errorlevel 1 (
  echo Error al ejecutar monorepo-split.mjs
  pause
  exit /b 1
)
echo.
echo Listo. Instala dependencias del frontend:
echo   cd frontend
echo   npm install --legacy-peer-deps
echo   npx expo start
pause
