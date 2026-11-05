# Mini servidor local do Anzol (sem instalar nada: só PowerShell do Windows).
# Como rodar (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
# Depois abra no navegador:  http://localhost:8080/app/   (testes: http://localhost:8080/tests/)
# Para parar: feche a janela ou aperte Ctrl+C.
# Segurança: só aceita conexões do próprio computador (localhost), só GET/HEAD e só arquivos dentro da pasta do projeto.

param([int]$Porta = 8080)
$raiz = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'; '.svg' = 'image/svg+xml'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.ico' = 'image/x-icon'; '.webmanifest' = 'application/manifest+json'
}
$ouvinte = New-Object System.Net.HttpListener
$ouvinte.Prefixes.Add("http://localhost:$Porta/")
$ouvinte.Start()
Write-Host "Anzol rodando em http://localhost:$Porta/app/  (Ctrl+C para parar)"
try {
  while ($ouvinte.IsListening) {
    $ctx = $ouvinte.GetContext()
    $resp = $ctx.Response
    try {
      if ($ctx.Request.HttpMethod -notin @('GET', 'HEAD')) { $resp.StatusCode = 405; continue }
      $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($caminho -eq '') { $resp.Redirect('/app/'); continue }
      $arquivo = [IO.Path]::GetFullPath((Join-Path $raiz $caminho))
      if (-not $arquivo.StartsWith($raiz, [StringComparison]::OrdinalIgnoreCase)) { $resp.StatusCode = 403; continue }
      if (Test-Path $arquivo -PathType Container) { $arquivo = Join-Path $arquivo 'index.html' }
      $nome = [IO.Path]::GetFileName($arquivo)
      if (-not (Test-Path $arquivo -PathType Leaf) -or $nome -like '.*' -or $arquivo -match '\\\.git\\') { $resp.StatusCode = 404; continue }
      $ext = [IO.Path]::GetExtension($arquivo).ToLower()
      $resp.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { 'application/octet-stream' }
      $resp.Headers.Add('Cache-Control', 'no-store')
      $resp.Headers.Add('X-Content-Type-Options', 'nosniff')
      $bytes = [IO.File]::ReadAllBytes($arquivo)
      $resp.ContentLength64 = $bytes.Length
      if ($ctx.Request.HttpMethod -eq 'GET') { $resp.OutputStream.Write($bytes, 0, $bytes.Length) }
    } catch { $resp.StatusCode = 500 } finally { $resp.Close() }
  }
} finally { $ouvinte.Stop() }
