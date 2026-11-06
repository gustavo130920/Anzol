# Anzol

**Aprenda a reconhecer golpes e se proteger no mesmo lugar.**
Protótipo acadêmico — Global Solution FIAP 2026 (CitizenTech).

> **SIMULAÇÃO — material educativo.** Organizações, pessoas e endereços de exemplo são fictícios (domínios `.test`/`.example`). O Anzol **nunca abre links**: analisa apenas o texto.

## Como abrir no computador (Windows)

1. Abra o PowerShell na pasta do projeto.
2. Rode o mini servidor local (só o seu computador acessa):
   ```
   powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
   ```
3. No navegador, abra `http://localhost:8080/app/`
4. Para parar, aperte `Ctrl+C` na janela do PowerShell.

> Por que um servidor? Por segurança, o navegador não deixa uma página aberta direto do disco ler os arquivos de dados. Publicado na nuvem, o site funciona sem isso.

## Testes

| O quê | Como rodar |
|---|---|
| Scanner (22 casos) pelo Node.js | `node tests/scanner.test.js` |
| Listas públicas de phishing (sem rede, sem domínios reais) | `node tests/listas.test.js` |
| Jogo (XP, níveis, selos, sequência, reteste) | `node tests/jogo.test.js` |
| Radar (estados, comparação, relato, moderação, privacidade) | `node tests/radar.test.js` |
| Atualizar o recorte `.br` do Phishing.Database | `node tools/atualizar-listas.js` |
| Scanner pelo navegador | servidor ligado → `http://localhost:8080/tests/` |
| Dados (cenários, pistas, só domínios reservados) | `powershell -ExecutionPolicy Bypass -File tests\validar-dados.ps1` |
| Regenerar `docs/cenarios.md` a partir do JSON | `powershell -ExecutionPolicy Bypass -File tools\gerar-cenarios-md.ps1` |

## Estrutura

```
app/
  index.html          tela (Scanner)
  css/app.css         visual (fonte grande, alto contraste, modo escuro)
  js/scanner.js       motor de regras do Scanner (sem dependências)
  js/app.js           tela do Scanner
  data/signals.json   motor de sinais: 35 pistas usadas por todos os módulos
  data/scanner-config.json  palavras-chave, faixas de risco, referências (parâmetros iniciais)
  data/scenarios.json cenários e testes do jogo
docs/                 documento-base, cenários, checklist do que falta confirmar
tests/                testes automáticos
tools/                servidor local e gerador de documentação
```

## O que é regra e o que é IA

O **Radar** usa **IA leve** para agrupar variantes da mesma campanha (trigramas + TF-IDF + similaridade do cosseno); estados, limiares e revisão humana são **regras**. O Scanner é **100% regras explicáveis** (cada motivo aponta para uma pista do motor de sinais), mais uma camada de **listas públicas de phishing**. O "teste do dia" do jogo também é **regra** (mira a pista que a pessoa mais deixou passar). As partes de IA (agrupar variantes de campanhas no Radar) e de visão computacional (ler prints) entram nas próximas etapas.

## Listas públicas de phishing (créditos)

- **Phishing.Database** — licença MIT, Copyright (c) 2018-2025 Mitchell Krog, Nissar Chababy e contribuidores. O projeto guarda só um recorte `.br` como impressões digitais (SHA-256).
- **OpenPhish Community Feed** — baixado na hora pelo navegador de quem usa, para uso pessoal/acadêmico, conforme os termos do OpenPhish. Nenhuma cópia é guardada ou redistribuída.
- O endereço analisado **nunca é enviado** a essas fontes: a comparação é feita no aparelho.
