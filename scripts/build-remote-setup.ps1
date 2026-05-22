# Concatena migraciones en supabase/remote-setup.sql para pegar en SQL Editor
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "supabase\remote-setup.sql"
$files = @(
  "001_schema.sql",
  "002_rls_policies.sql",
  "003_storage.sql",
  "004_realtime.sql",
  "005_auth_trigger.sql"
)
$header = @"
-- Nosotros - Setup remoto unificado
-- Generado: $(Get-Date -Format o)
-- Ejecutar en Supabase SQL Editor (puede tardar unos segundos)

"@

Set-Content -Path $out -Value $header -Encoding UTF8
foreach ($f in $files) {
  $path = Join-Path $root "supabase\migrations\$f"
  if (-not (Test-Path $path)) { Write-Warning "Missing $path"; continue }
  Add-Content -Path $out -Value "`n-- ========== $f ==========`n" -Encoding UTF8
  Get-Content $path -Raw | Add-Content -Path $out -Encoding UTF8
}
$seed = Join-Path $root "supabase\seed.sql"
if (Test-Path $seed) {
  Add-Content -Path $out -Value "`n-- ========== seed.sql ==========`n" -Encoding UTF8
  Get-Content $seed -Raw | Add-Content -Path $out -Encoding UTF8
}
Write-Host "OK: $out"
Write-Host "Siguiente: abre el archivo en Supabase SQL Editor y ejecuta Run."
