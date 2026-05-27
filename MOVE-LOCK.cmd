@echo off
cd /d "%~dp0"
if exist package-lock.json (
  move /Y package-lock.json frontend\package-lock.json
  echo package-lock.json movido a frontend\
) else if exist frontend\package-lock.json (
  echo frontend\package-lock.json ya existe.
) else (
  echo No hay package-lock.json. Ejecuta: cd frontend ^&^& npm install --legacy-peer-deps
)
