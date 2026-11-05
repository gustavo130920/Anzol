# Verificador dos dados do Anzol (sem dependências: só PowerShell do Windows).
# Como rodar (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File tests\validar-dados.ps1
# O que faz: lê app/data/*.json e confere regras de conteúdo e de segurança do projeto.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$falhas = New-Object System.Collections.Generic.List[string]
function Falha($msg) { $script:falhas.Add($msg) }

# 1. JSON válido
try {
  $signals = Get-Content -Raw -Encoding UTF8 (Join-Path $raiz 'app\data\signals.json') | ConvertFrom-Json
  $dados   = Get-Content -Raw -Encoding UTF8 (Join-Path $raiz 'app\data\scenarios.json') | ConvertFrom-Json
} catch { Write-Host "FALHA: JSON inválido -> $($_.Exception.Message)" -ForegroundColor Red; exit 1 }

# 2. Sinais: ids únicos e família existente
$familias = @($signals.familias | ForEach-Object { $_.id })
$idsSinais = @($signals.sinais | ForEach-Object { $_.id })
if ($idsSinais.Count -ne ($idsSinais | Select-Object -Unique).Count) { Falha 'signals.json: há ids de sinal repetidos' }
foreach ($s in $signals.sinais) { if ($familias -notcontains $s.familia) { Falha "sinal '$($s.id)': família '$($s.familia)' não existe" } }

# 3. Contagens
$cen = @($dados.cenarios)
$golpes = @($cen | Where-Object { -not $_.legitima }).Count
$legit  = @($cen | Where-Object { $_.legitima }).Count
if ($cen.Count -ne 12) { Falha "esperados 12 cenários, há $($cen.Count)" }
if ($golpes -ne 8)     { Falha "esperados 8 golpes, há $golpes" }
if ($legit -ne 4)      { Falha "esperados 4 legítimos, há $legit" }
if (@($dados.testes_dominio).Count -ne 4)      { Falha 'esperados 4 testes de domínio' }
if (@($dados.testes_procedimento).Count -ne 3) { Falha 'esperados 3 testes de procedimento' }

# 4. Rótulo, pistas válidas, decisão válida, 4 perguntas
$rotulo = 'SIMULAÇÃO — material educativo'
$decisoes = @($dados.decisoes.PSObject.Properties.Name)
$todos = @($cen) + @($dados.testes_dominio) + @($dados.testes_procedimento)
foreach ($i in $todos) { if ($i.rotulo -ne $rotulo) { Falha "$($i.id): sem rótulo de simulação" } }
$ids = @($todos | ForEach-Object { $_.id })
if ($ids.Count -ne ($ids | Select-Object -Unique).Count) { Falha 'há ids de item repetidos' }
foreach ($c in $cen) {
  foreach ($p in $c.pistas) { if ($idsSinais -notcontains $p.id) { Falha "$($c.id): pista '$($p.id)' não existe em signals.json" } }
  if ($decisoes -notcontains $c.decisao_correta) { Falha "$($c.id): decisão '$($c.decisao_correta)' não está em 'decisoes'" }
  foreach ($q in 'quem','o_que','por_onde','como_confirmo') { if (-not $c.perguntas.$q) { Falha "$($c.id): falta pergunta '$q'" } }
}
foreach ($t in $dados.testes_dominio) {
  if (@($t.opcoes | Where-Object { $_.correto }).Count -ne 1) { Falha "$($t.id): precisa de exatamente 1 opção correta" }
  foreach ($o in $t.opcoes) { foreach ($s in $o.sinais) { if ($idsSinais -notcontains $s) { Falha "$($t.id): sinal '$s' não existe" } } }
}
foreach ($t in $dados.testes_procedimento) {
  if (@($t.opcoes | Where-Object { $_.correto }).Count -ne 1) { Falha "$($t.id): precisa de exatamente 1 opção correta" }
}

# 5. Segurança: todo domínio citado nos dados precisa ter TLD reservado
$texto = Get-Content -Raw -Encoding UTF8 (Join-Path $raiz 'app\data\scenarios.json')
# remove URLs de fontes (campo fonte_url), que são reais por natureza
$semFontes = [regex]::Replace($texto, '"fonte_url"\s*:\s*"[^"]*"', '')
$candidatos = [regex]::Matches($semFontes, '\b([a-z0-9-]+\.)+[a-z]{2,}\b') | ForEach-Object { $_.Value.ToLower() } | Select-Object -Unique
foreach ($d in $candidatos) {
  $tld = $d.Split('.')[-1]
  if (@('test','example','invalid','json','md') -notcontains $tld) { Falha "domínio com TLD não reservado: '$d'" }
}

# Resultado
if ($falhas.Count -eq 0) {
  Write-Host "OK: $($cen.Count) cenários ($golpes golpes, $legit legítimos), $(@($dados.testes_dominio).Count) testes de domínio, $(@($dados.testes_procedimento).Count) de procedimento, $($idsSinais.Count) sinais. Nenhum problema." -ForegroundColor Green
  exit 0
} else {
  $falhas | ForEach-Object { Write-Host "FALHA: $_" -ForegroundColor Red }
  exit 1
}
