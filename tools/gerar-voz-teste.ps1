# Anzol — gera uma narração de TESTE com a voz sintética do Windows (pt-BR), um .wav por trecho.
# Serve só para ensaiar o tempo e testar o editor (tools/editar-video.js). O vídeo entregue usa a sua voz.
# Uso: powershell -ExecutionPolicy Bypass -File tools\gerar-voz-teste.ps1 [-Pasta gravacao\teste-voz] [-Velocidade 0]
param(
  [string]$Pasta = (Join-Path $PSScriptRoot '..\gravacao\teste-voz'),
  [int]$Velocidade = 0   # -10 (lento) a 10 (rápido)
)
Add-Type -AssemblyName System.Speech
$cfg = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot '..\docs\video\trechos.json') | ConvertFrom-Json
New-Item -ItemType Directory -Force $Pasta | Out-Null
$voz = New-Object System.Speech.Synthesis.SpeechSynthesizer
$pt = $voz.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
if (-not $pt) { throw 'Nenhuma voz pt-BR instalada no Windows.' }
$voz.SelectVoice($pt.VoiceInfo.Name)
$voz.Rate = $Velocidade
foreach ($t in $cfg.trechos) {
  if ($t.opcional) { continue }
  $arq = Join-Path $Pasta ($t.id + '.wav')
  $voz.SetOutputToWaveFile($arq)
  $voz.Speak($t.texto)
  $voz.SetOutputToNull()
  Write-Output ("{0}  {1}" -f $t.id, $arq)
}
$voz.Dispose()
