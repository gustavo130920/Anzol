# Gravar a narração e montar o vídeo final

> A montagem é automática: cada arquivo de áudio vira um trecho do vídeo, com o slide (ou o pedaço da demonstração) certo durante a fala. O trecho dura exatamente o tempo que você falou.

## 1. Como gravar

1. **Um arquivo por trecho** (tabela abaixo), com o nome do trecho: `02.m4a`, `03.m4a`, `09a.m4a`… Errou? Grave aquele trecho de novo; os outros ficam.
2. Formatos aceitos: m4a (gravador do Windows ou do celular), mp3, wav, ogg, opus, webm, aac.
3. Coloque os arquivos em **`gravacao/audio/`** dentro da pasta do projeto (essa pasta não vai para o GitHub).
4. Dicas de som:
   - Cômodo pequeno, com cortina, cama ou roupas por perto: o eco cai muito.
   - Celular a um palmo da boca, um pouco de lado (evita o "p" estourado).
   - Comece a falar 1 s depois de apertar gravar e pare 1 s depois de terminar: o editor junta os trechos com uma pausa curta. **Silêncio sobrando no começo ou no fim vira pausa no vídeo**, então corte se ficar longo.
   - Fale como quem explica para um amigo, ritmo calmo. O alvo total é **4:50**. O editor avisa se passar de 5:00.
5. O texto está no `docs/roteiro-video.md`. Pode trocar palavras para o seu jeito de falar, **mas não os números**. Se mudar uma frase, avise para atualizar `docs/video/trechos.json` (usado no teste de voz).

| Trecho | Na tela | Fala (resumo; texto completo no roteiro) |
|---|---|---|
| 01 *(opcional)* | Capa | Sem fala: a capa aparece 2,5 s |
| 02 | Slide 2 | "Em 2025, o Brasil registrou 2,26 milhões de estelionatos…" |
| 03 | Slide 3 · funil | "Numa pesquisa de 2026, 81%…" |
| 04 | Slide 4 | "E só 42% confiam… 40%…" |
| 05 | Slide 5 | "Avisos existem… falta de prática, e de ajuda na hora certa." |
| 06 | Slide 6 · público | "O Anzol é para o cidadão comum…" |
| 07 | Slide 7 · mercado | "O hábito de checar já existe… 10,1 bilhões…" |
| 08 | Slide 8 · 4 perguntas | "O Anzol junta aprender e se proteger…" |
| 09a | Demonstração · Scanner | "Recebi este anúncio…" |
| 09b | Demonstração · Radar | "O Radar já conhece essa campanha…" |
| 09c | Demonstração · Treino | "Daqui, treino com esse golpe real…" |
| 09d | Demonstração · Caí no golpe + Kit | "E se eu já tivesse pago?…" |
| 10 | Slide 10 · diferencial | "Existem campanhas… Tudo gratuito." |
| 11 | Slide 11 · 4 tecnologias | "E as quatro tecnologias funcionam de verdade…" |
| 12 | Slide 12 · indicadores | "Como saber se funciona?…" |
| 13 | Slide 13 · validação | "Validação: hoje são 135 verificações…" |
| 14 | Slide 14 · expansão | "Expansão… Sustentabilidade…" |
| 15 | Slide 15 · ODS | "Contribuímos com os ODS 4.4 e 10.2." |
| 16 | Slide 16 · fechamento | "Antes de agir: quem pede, o que pede…" |

Na demonstração (09a–09d), o vídeo do app acelera ou desacelera (de 0,5× a 2,5×) para caber na sua fala.

## 2. Como montar

Com o servidor local ligado (`powershell -ExecutionPolicy Bypass -File tools\servidor.ps1`):

```
node tools/editar-video.js
```

- Resultado: `gravacao/video-final.webm` (Full HD, com som) e `gravacao/video-final-tempos.txt` (onde começa cada trecho e a duração total).
- A montagem acontece em tempo real: um vídeo de 4:50 leva cerca de 5 minutos.
- O YouTube aceita `.webm` direto.

## 3. Ensaio com voz sintética (opcional)

Para ver o vídeo montado antes de gravar, com a voz "Maria" do Windows (só para teste):

```
powershell -ExecutionPolicy Bypass -File tools\gerar-voz-teste.ps1
node tools/editar-video.js gravacao/teste-voz gravacao/ensaio-voz-teste.webm
```
