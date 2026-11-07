# Roteiro do vídeo-pitch — Anzol

> Global Solution 2 · FIAP · CitizenTech. Duração-alvo: **4:50** (limite 5:00). Versão 1.0 · 06/11/2026.
> Ritmo de referência: ~140 palavras por minuto. Contagem de palavras da fala no fim do arquivo.
> Tempo distribuído pelos pontos: o critério 5 (8 pontos) recebe o maior bloco.

## Visão geral

| Tempo | Critério (pontos) | Bloco |
|---|---|---|
| 0:00–0:45 | 1 · Problema (3) | O problema com números |
| 0:45–1:25 | 2 · Público e mercado (3) | Quem usa, quem paga, por que agora |
| 1:25–2:45 | 3 · Impacto e valor (3) | Demonstração do caminho completo |
| 2:45–3:30 | 4 · Diferencial (3) | O que combinamos e as 4 tecnologias |
| 3:30–4:50 | 5 · Resultados e impacto (8) | Indicadores, validação, implementação, expansão, sustentabilidade, ODS |

---

## 1. Problema — 0:00 a 0:45

**Tela:** cabeçalho do Anzol (logo) por 2 s → números aparecendo em texto grande sobre fundo preto.

> Em 2025, o Brasil registrou 2,26 milhões de estelionatos: 258 por hora, um recorde.
> Numa pesquisa de 2026, 81% dos adultos tiveram contato com golpe. De quem encontra um golpe, 56% interagem, e um em cada quatro desses perde dinheiro.
> E só 42% confiam que sabem reconhecer um golpe. 40% só perceberam que caíram depois de um alerta de outra pessoa.
> Avisos existem. Mas treino passivo funciona pouco: num estudo com 20 mil funcionários, só módulos interativos concluídos reduziram as falhas.
> O problema não é falta de aviso. É falta de prática, e de ajuda na hora certa.

| Número | Fonte | Verificado |
|---|---|---|
| 2,26 mi estelionatos (todos os tipos), 258/h, recorde | Anuário Brasileiro de Segurança Pública 2026, via Olhar Digital (fonte secundária) | 04–05/11/2026 |
| 81%, 56%, 1 em 4 (25%), 42%, 40% | GASA — O Estado dos Golpes Brasil 2026 (pesquisa online, 1.170 adultos) | 04–05/11/2026 |
| 20 mil funcionários; só módulos interativos concluídos reduziram falhas | UC San Diego Health, via Tecnoblog | 04–05/11/2026 |

**Cuidado:** dizer "estelionatos" (não "golpes digitais"). Não somar GASA com outras pesquisas.

---

## 2. Público e mercado — 0:45 a 1:25

**Tela:** três "cartões" de público (cidadão · família de idosos · pequeno vendedor) → número das fraudes no sistema bancário.

> O Anzol é para o cidadão comum com celular, com prioridade para quem menos confia em si mesmo: segundo a mesma pesquisa, a Geração X e as mulheres.
> Também para quem cuida de pais idosos e para pequenos vendedores.
> O hábito de checar já existe: 26% já perguntam a ferramentas de inteligência artificial se algo é golpe, e 18% usam app antigolpe.
> Do outro lado, fraudes e golpes no sistema bancário somaram 10,1 bilhões de reais em 2024, segundo a Febraban.
> Bancos, operadoras, prefeituras e escolas têm interesse direto em cidadãos que caem menos.

| Número | Fonte | Verificado |
|---|---|---|
| Geração X e mulheres menos confiantes; 26% IA; 18% app antigolpe | GASA 2026 | 04–05/11/2026 |
| R$ 10,1 bi em fraudes e golpes no sistema bancário em 2024 (não dizer "os bancos perderam": a fonte não diz quem absorveu) | Febraban, divulgado em 11/03/2025, **via imprensa** (InfoMoney, Poder360); comunicado original não localizado | 06/11/2026 |

---

## 3. Solução e demonstração — 1:25 a 2:45

**Tela:** gravação do app (ver `docs/telas-gravacao.md`, tomadas 2 a 7). A fala acompanha o que aparece.

> O Anzol junta aprender e se proteger no mesmo lugar, com quatro perguntas: quem pede, o que pede, por onde veio, e como confirmo por outro caminho.
> Recebi este anúncio. Colo no Scanner: risco alto, com os motivos. Oferta boa demais, pagamento só por Pix, endereço que imita a loja. E o Anzol nunca abre o link.
> O Radar já conhece essa campanha: três pessoas relataram. Relato em um toque, só o indicador do golpista, nada meu. E o alerta é ligado para a próxima pessoa.
> Daqui, treino com esse golpe real: marco as pistas, uso a lupa de domínio e decido. O jogo premia investigar, não ser rápido.
> E se eu já tivesse pago? O "Caí no golpe" mostra o que fazer agora, hoje e depois. E o Kit de provas lê o comprovante no próprio aparelho e monta o rascunho para o banco e o boletim de ocorrência.

**Rótulos que precisam aparecer na tela:** faixa "SIMULAÇÃO — material educativo"; selo SIMULAÇÃO no Radar e no exemplo do Kit.

---

## 4. Diferencial — 2:45 a 3:30

**Tela:** comparação simples (campanhas · jogos · apps de veredito · Anzol) → diagrama `docs/arquitetura.svg`.

> Existem campanhas, jogos educativos e apps que dão um veredito com inteligência artificial.
> Nós combinamos quatro coisas que não costumam andar juntas: treino com golpes brasileiros reais; um scanner que mostra o risco com os motivos, nunca um veredito; um radar comunitário de indicadores, nunca de acusações; e o passo a passo depois do golpe. Tudo gratuito.
> E as quatro tecnologias funcionam de verdade: regras explicáveis no scanner; inteligência artificial leve que agrupa variantes de golpes no Radar; visão computacional que lê prints e reconhece imagens repetidas, no próprio aparelho; e nuvem, que testa, publica e consulta listas públicas de phishing todos os dias.

| Afirmação | Base | Verificado |
|---|---|---|
| Campanhas (Febraban), jogos (Google "Evite Golpes"), apps de veredito (GolpeZero) | Pesquisa de concorrentes | 06/11/2026 |
| "Combinamos" (nunca "ninguém faz") | Regra do projeto | — |

**Antes de gravar:** testar por dentro o Google "Evite Golpes" e o GolpeZero (R8).

---

## 5. Resultados e impacto — 3:30 a 4:50 (8 pontos)

**Tela:** aba Painel (funil real, gráficos) → Testes (evolução antes × depois) → GitHub Actions com "testes passaram" → site no ar.

> Como saber se funciona? Medimos comportamento, não cliques.
> Os indicadores: quantos golpes a pessoa trataria como legítimos no teste inicial e no reteste; quantas mensagens legítimas trataria como golpe, para não criar paranoia; o tempo entre abrir o "Caí no golpe" e falar com o banco; as ações de proteção concluídas; e, no Radar, o tempo do primeiro relato até o alerta e as contestações aceitas.
> Validação: hoje são 179 verificações automáticas a cada publicação. O próximo passo é um piloto com 5 a 10 pessoas, com consentimento e sem dados pessoais. Sem valor estatístico, e a gente diz isso.
> Implementação: o protótipo já está no ar, de graça.
> Expansão: Radar compartilhado num banco na nuvem, golpes com voz clonada e alerta ativo só para campanhas confirmadas.
> Sustentabilidade: gratuito para o cidadão, com custo por uso perto de zero, financiado por quem perde com o golpe: bancos, operadoras e prefeituras, com o painel do Radar e programas de educação digital.
> Contribuímos com os ODS 4.4 e 10.2.
> Antes de agir: quem pede, o que pede, por onde veio, como confirmo. Anzol.

| Afirmação | Base | Verificado |
|---|---|---|
| 179 verificações automáticas | `node tests/rodar-todos.js` mostra o total (7 conjuntos; cada linha "OK" = 1 verificação). Reconferir no dia da gravação, porque o número muda quando entram testes novos | 06/11/2026 |
| Protótipo no ar | https://gustavo130920.github.io/Anzol/ | 06/11/2026 |
| Custo por uso perto de zero | processamento no aparelho; GitHub Pages/Actions gratuitos em repositório público | 05–06/11/2026 |
| Financiamento por bancos/operadoras/prefeituras | **HIPÓTESE** (dizer "pode ser financiado", se preferir) | — |
| ODS 4.4 (habilidades) e 10.2 (inclusão) | brasil.un.org | 05/11/2026 |

---

## Checklist antes de gravar

- [ ] Fazer as 4 checagens do R8 (`docs/a-confirmar.md`), incluindo a fonte do R$ 10,1 bi (✅ 06/11: Febraban 11/03/2025 via imprensa; frase corrigida).
- [ ] Ensaiar em voz alta com cronômetro: alvo 4:50 (máximo 5:00).
- [ ] Gravar as telas separadas da narração (ver `docs/telas-gravacao.md`).
- [ ] Legendas, se possível.
- [ ] YouTube **não listado** → testar o link em aba anônima → `.txt` com o link no FIAP ON até **18/11**.

## Duração estimada da fala

~620 palavras ≈ **4:25 a 140 palavras/min** (ritmo calmo) · ≈ 3:50 a 160 palavras/min. A folga até 4:50 cobre as pausas da demonstração. Conferir com cronômetro no ensaio.
