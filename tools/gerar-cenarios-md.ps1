# Gera docs/cenarios.md a partir de app/data/scenarios.json e signals.json.
# Como rodar (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File tools\gerar-cenarios-md.ps1
# Fonte da verdade = o JSON. Não edite cenarios.md à mão: edite o JSON e rode de novo.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$sig  = Get-Content -Raw -Encoding UTF8 (Join-Path $raiz 'app\data\signals.json') | ConvertFrom-Json
$d    = Get-Content -Raw -Encoding UTF8 (Join-Path $raiz 'app\data\scenarios.json') | ConvertFrom-Json
$nome = @{}; foreach ($s in $sig.sinais) { $nome[$s.id] = $s.nome }
$linhas = @{ 1 = 'Linha 1 · Pix, boleto, loja e trabalho'; 2 = 'Linha 2 · Mensagem de "conhecido" ou instituição'; 3 = 'Linha 3 · Link, site e SMS' }
$o = New-Object System.Text.StringBuilder
function L($t = '') { [void]$o.AppendLine($t) }
# Endereços sempre entre crases (não viram link clicável no Markdown)
function C($t) { if ($t) { '`' + $t + '`' } else { '—' } }

L '# Cenários e testes do Anzol'
L
L '> **SIMULAÇÃO — material educativo.** Organizações, pessoas, números e domínios são fictícios. Domínios usam só `.test`, `.example` ou `.invalid`. Nenhum link é clicável.'
L "> Gerado automaticamente de ``app/data/scenarios.json`` (versão $($d._versao), $($d._atualizado_em)). **Status: $($d._status)**"
L
$cen = @($d.cenarios)
L "**Resumo:** $($cen.Count) cenários ($(@($cen | ? { -not $_.legitima }).Count) golpes, $(@($cen | ? { $_.legitima }).Count) legítimos) · $(@($d.testes_dominio).Count) testes de domínio · $(@($d.testes_procedimento).Count) testes de procedimento."
L
L '| ID | Título | Linha | Tipo | Nível | Canal |'
L '|---|---|---|---|---|---|'
foreach ($c in $cen) { L "| $($c.id) | $($c.titulo) | $($c.linha) | $(if ($c.legitima) {'legítima'} else {'golpe'}) | $($c.nivel) | $($c.canal) |" }
L

foreach ($n in 1,2,3) {
  L "## $($linhas[$n])"
  L
  foreach ($c in ($cen | ? { $_.linha -eq $n })) {
    $tipo = if ($c.legitima) { 'LEGÍTIMA' } else { 'GOLPE' }
    L "### $($c.id) — $($c.titulo) ($tipo · nível $($c.nivel))"
    L
    L "- **Organização (fictícia):** $($c.organizacao_ficticia)"
    L "- **Canal:** $($c.canal)"
    if ($c.contexto_simulado) { L "- **Contexto:** $($c.contexto_simulado)" }
    L
    L "> $($c.mensagem -replace '([a-z0-9-]+\.)+(test|example|invalid)(/\S*)?', '`$0`')"
    L
    if ($c.imagem_descricao) { L "*Imagem:* $($c.imagem_descricao)"; L }
    if ($c.link_exibido) { L "**Endereço exibido:** $(C $c.link_exibido)"; L }
    L '| Pista | Trecho | Por que importa |'
    L '|---|---|---|'
    foreach ($p in $c.pistas) { L "| $($nome[$p.id]) | $($p.trecho -replace '([a-z0-9-]+\.)+(test|example|invalid)', '`$0`') | $($p.explicacao) |" }
    L
    L "**4 perguntas:** Quem pede? $($c.perguntas.quem) · O que pede? $($c.perguntas.o_que) · Por onde veio? $($c.perguntas.por_onde) · Como confirmo? $($c.perguntas.como_confirmo)"
    L
    L "**Decisão certa:** $($d.decisoes.($c.decisao_correta))"
    L
    L "**Feedback:** $($c.feedback)"
    L
    $fonte = if ($c.fonte_url) { "<$($c.fonte_url)> — verificado em $($c.fonte_verificada_em)" } else { 'sem fonte externa (cenário de calibração)' }
    L "*Baseado em:* $($c.baseado_em) *Fonte:* $fonte"
    L
  }
}

L '## Testes de domínio ("qual é o endereço verdadeiro?")'
L
foreach ($t in $d.testes_dominio) {
  L "### $($t.id) — $($t.organizacao_ficticia) (nível $($t.nivel))"
  L
  L ($t.enunciado -replace '([a-z0-9-]+\.)+(test|example|invalid)', '`$0`')
  L
  L '| Endereço | Correto? | Sinais | Explicação |'
  L '|---|---|---|---|'
  foreach ($op in $t.opcoes) {
    $sn = if ($op.sinais.Count) { ($op.sinais | % { $nome[$_] }) -join ', ' } else { '—' }
    L "| $(C $op.endereco) | $(if ($op.correto) {'**sim**'} else {'não'}) | $sn | $($op.explicacao -replace '''([^'']+\.(test|example|invalid))''', '`$1`') |"
  }
  L
  L "**Lupa de domínio:** $($t.dica_lupa)"
  L
}

L '## Testes de procedimento ("qual o próximo passo certo?")'
L
foreach ($t in $d.testes_procedimento) {
  L "### $($t.id) (nível $($t.nivel) · pergunta-chave: $($sig.perguntas.($t.pergunta_chave)))"
  L
  L $t.situacao
  L
  foreach ($op in $t.opcoes) { L "- $(if ($op.correto) {'✅'} else {'❌'}) **$($op.texto)** — $($op.explicacao)" }
  L
  if ($t.aviso) { L "> $($t.aviso)"; L }
  if ($t.fonte_url) { L "*Fonte:* <$($t.fonte_url)>"; L }
}

L '## Decisões possíveis'
L
foreach ($k in $d.decisoes.PSObject.Properties) { L "- ``$($k.Name)``: $($k.Value)" }

$destino = Join-Path $raiz 'docs\cenarios.md'
[IO.File]::WriteAllText($destino, $o.ToString(), (New-Object Text.UTF8Encoding $false))
Write-Host "Gerado: $destino"
