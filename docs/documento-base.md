# Anzol — Documento-base

> Global Solution 2 · FIAP · CitizenTech — Área 10 (Design, UX e Segurança Digital), com toques nas áreas 5, 6 e 7.
> Versão 0.1 · 05/11/2026 · **RASCUNHO para revisão**.
> Convenções: todo número tem **fonte e data**. **A CONFIRMAR** = não verificado. **HIPÓTESE** = ideia nossa, sem validação. **SIMULAÇÃO** = demonstrado com dados fictícios.

---

## 0. Em uma frase

**Anzol é uma plataforma gratuita para o cidadão aprender a reconhecer golpes e se proteger no mesmo lugar, com golpes brasileiros reais e atualizados.**

### O procedimento que o Anzol ensina (a espinha do produto)

1. **Quem pede?**
2. **O que pede?**
3. **Por onde veio?**
4. **Como confirmo por outro caminho?**

E mais a **palavra de segurança em família**: uma palavra combinada que o familiar pode pedir quando desconfiar de uma voz clonada.

*Por que essas perguntas?* Entre quem não pagou, os motivos mais citados foram "oferta boa demais" (31%), "pedido suspeito" (31%) e "não condiz com organizações legítimas" (25%). A aparência quase não aparece. O que protege é olhar **o pedido e o canal**. (GASA 2026, ver Fontes [F1].)

---

## 1. Problema (critério 1 · 3 pontos)

**Golpes digitais atingem milhões de brasileiros. A maioria não confia na própria capacidade de reconhecê-los, muitos só percebem depois de alertados e o treinamento passivo tem eficácia contestada.**

| Evidência | Número | Fonte |
|---|---|---|
| Tiveram contato com golpe | 81% dos adultos pesquisados | [F1] GASA 2026 |
| Dos que encontram golpe, interagem | 56% | [F1] |
| Dos que interagem, perdem dinheiro | 25% (10% do total) | [F1] |
| Perdas estimadas (extrapoladas) | ~R$ 21,2 bi; média R$ 1.287,20; mediana R$ 295,90 | [F1] |
| Golpes com perda resolvidos em minutos / em até 1 dia | 26% / 42% | [F1] |
| Só perceberam depois de alerta de outra fonte | 40% | [F1] |
| Confiam em reconhecer golpes | 42% (menos confiantes: Geração X e mulheres) | [F1] |
| Vítimas com impacto no bem-estar | 76% | [F1] |
| Recuperaram ou foram reembolsados | 20% | [F1] |
| Estelionatos registrados em 2025 (**todos os tipos**, não só digitais) | 2.261.055; 258 por hora; +429,8% desde 2018 | [F2] Anuário FBSP 2026 |
| Perdas dos bancos com golpes e fraudes, 2024 | R$ 10,1 bi (+17%); via Pix R$ 2,7 bi (+43%) | [F3] Febraban |
| Vítimas de golpes com Pix/boleto (jul/2024–jun/2025) | ~24 milhões; ~R$ 29 bi | [F3] FBSP/Datafolha |
| Treinamento passivo | Diferença de 1,7% nas falhas entre treinados e não treinados; só módulos **interativos concluídos** reduziram 19% a chance de falha | [F4] UC San Diego Health |

**Atenção ao citar:** o GASA (R$ 21,2 bi) e o FBSP (R$ 29 bi) usam metodologias diferentes. Não some os dois nem os compare sem citar a fonte de cada um. O número de 2,2 milhões é de **estelionatos de todos os tipos**, não de "golpes digitais".

**Novidade (04/11/2026):** o governo publicou regras contra golpes por SMS. São elas: um diretório nacional de códigos curtos em até 90 dias; o bloqueio de SMS vindo de códigos não cadastrados; e o monitoramento automático pelas operadoras. Uma pesquisa do Cetic.br citada pelo Ministério das Comunicações diz que 71% dos entrevistados relataram abordagem de golpistas por SMS. [F5] *(Texto no Diário Oficial: A CONFIRMAR.)* Isso **reforça o problema** e mostra que a regulação ataca o canal, não a capacidade do cidadão de reconhecer o golpe que ainda chega.

---

## 2. Público-alvo e mercado (critério 2 · 3 pontos)

**Quem usa:**
- **Primário:** adultos brasileiros com celular que recebem golpes por SMS, WhatsApp, ligações e anúncios. A prioridade são os grupos **menos confiantes**: Geração X e mulheres [F1].
- **Secundário:** familiares que cuidam de pais idosos (a palavra de segurança e os alertas compartilhados) e pequenos vendedores (golpe do comprovante falso).

**Contexto de adoção:**
- 26% já perguntam a ferramentas de IA se algo é golpe, e 18% usam app antigolpe [F1]. Ou seja, já existe o hábito de checar antes de agir.
- As fontes mais eficazes para reconhecer golpes são a experiência pessoal (37%), amigos e família (37%) e o banco (34%) [F1]. O Anzol simula a experiência pessoal sem a perda.

**Envolvidos (stakeholders):**

| Ator | Interesse | Papel no Anzol |
|---|---|---|
| Cidadão | Não cair, saber o que fazer se cair | Usuário (gratuito) |
| Bancos, fintechs, seguradoras | Reduzir perdas (R$ 10,1 bi em 2024 [F3]) | Possíveis financiadores (**HIPÓTESE**) |
| Operadoras | Cumprir regras de SMS e chamadas, reduzir abuso | Parceria futura (**HIPÓTESE**) |
| Prefeituras, escolas, Procons | Educação digital, atendimento | Possível uso institucional (**HIPÓTESE**) |
| Polícia, Detrans, OAB | Alertar sobre campanhas | Fontes oficiais para o Radar |

**Concorrência e substitutos (verificados; "não encontrei" não significa "não existe"):**
- Campanhas: Febraban "Pare e Pense", Febraban + Meta.
- Jogos e quizzes acadêmicos: Quiz60+, validado com 17 idosos; RPG de LGPD.
- Interland (público infantil).
- Treinamento corporativo (B2B): KnowBe4, Hoxhunt, Infosec IQ, Hacker Rangers.
- Anjo da Guarda (lê boleto por foto, sem parte de ensino).
- Chatbots de IA gerais.

*(Os recursos reais de cada um ainda serão checados antes do vídeo: **A CONFIRMAR**.)*

---

## 3. Impacto e valor: como funciona (critério 3 · 3 pontos)

### 3.1 Um motor, várias vitrines

O **Motor de sinais** (`app/data/signals.json`) é uma lista única de 35 "pistas" de golpe, organizada em 6 famílias:
- **gatilhos psicológicos** (pressões para agir sem pensar);
- **o que pedem** (dinheiro, código, dados);
- **canal e remetente**;
- **endereço e link**;
- **imagem e documento**;
- **sinais de legitimidade**.

Cada pista se liga a uma das 4 perguntas. **Todos os módulos usam a mesma lista**, então a pessoa aprende no jogo exatamente as pistas que o scanner aponta.

| Módulo | O que faz | Aberto desde o início? |
|---|---|---|
| **Testes/Jogo** | Cenário → investigar (marcar pistas, usar a lupa de domínio) → decidir → explicação → XP | Sim (camada fina) |
| **Scanner** | O usuário cola um link ou texto, ou envia um print, e recebe um **risco de 0 a 100 com motivos**, nunca um veredito. **Nunca abre o link.** | Sim |
| **Radar** | Banco de **indicadores** de golpes reportados. Se o mesmo golpe aparece para pessoas diferentes, o alerta já está ligado. | Sim (alerta passivo) |
| **Primeiros socorros** | "Caí no golpe, e agora?": triagem por situação, plano por urgência, canais oficiais | Sim |
| **Kit de provas** | Lê prints e comprovantes (visão computacional) e monta uma linha do tempo e um **rascunho** de relato para o banco e o BO | Sim |
| **Escudo** | 8 cartões de 60 segundos + checklist de 5 ações reais | Sim |

**Regra de produto:** a proteção nunca fica trancada atrás do jogo.

### 3.2 O caminho completo (o que o vídeo mostra)

```
Recebo mensagem suspeita
   → colo no Scanner → risco + motivos (pistas do motor)
   → o Radar já conhece a campanha? → "reportado por N pessoas" (alerta passivo)
   → se é nova: relato em um toque → fila de moderação (SIMULAÇÃO)
   → campanha confirmada vira cenário de teste (golpe real → aprendizado)
   → link para Primeiros socorros, caso a pessoa já tenha interagido
```

### 3.3 Benefícios
- **Segurança:** a pessoa decide pelo pedido e pelo canal, não pela aparência. Recebe um plano por ordem de urgência quando a perda já ocorreu: 26% dos golpes com perda se resolvem em minutos [F1], e o MED depende de agir rápido [F6].
- **Inclusão e acessibilidade (ODS 10):** linguagem simples, fonte grande, alto contraste, narração opcional por voz (`speechSynthesis`), sem cadastro e gratuito.
- **Bem-estar (ODS 3):** "errar sem vergonha", sem ranking competitivo e com lembrete de que qualquer um pode cair. Primeiros socorros indica apoio emocional: CVV, ligação 188, gratuita, 24 h [F7].

### 3.4 Primeiros socorros: triagem (regras, com fontes)

Pergunta única: **"O que aconteceu?"**

| Situação | Primeiras ações, por urgência |
|---|---|
| Fiz um Pix ou pagamento | Falar com o banco **agora** pelo app ou canal oficial → pedir o **MED** (até 80 dias após a transação, mas a pressa conta) → guardar provas → BO [F6] |
| Passei senha, código ou dados bancários, ou instalei algo | Avisar o banco; bloquear acessos e cartões; trocar senhas num aparelho seguro; remover o app desconhecido; BO |
| Só cliquei no link | Fechar; não informar nada; trocar a senha se a digitou; acompanhar extratos |
| WhatsApp clonado | Reinstalar e verificar o número com o código oficial; ativar a confirmação em duas etapas; avisar contatos. Se o invasor ativou o PIN, pode ser preciso esperar 7 dias [F8, **A CONFIRMAR na Central de Ajuda oficial**] |
| Passei CPF, documentos ou selfie | Consultar o **Registrato** (Banco Central; exige gov.br prata ou ouro); avisar bancos; proteger a conta gov.br [F9] |
| "Acho que caí, mas não sei" | Checagem guiada: extratos, Registrato, aparelhos conectados, apps instalados |

Se o prazo passou ou o banco negou: reclamação ao Banco Central, Procon, consumidor.gov.br e orientação jurídica.

**Avisos fixos no app:**
- "Não prometemos recuperação de dinheiro."
- "Isto não é aconselhamento jurídico."
- "**Ninguém deve pagar para 'recuperar' dinheiro.** Isso é o golpe da recuperação."

**Não apague conversas:** prints, chaves Pix, links e comprovantes são provas.

---

## 4. Diferencial (critério 4 · 3 pontos)

**Não dizemos "ninguém faz X". Dizemos: combinamos X, Y e Z.**

1. **Aprender e se proteger no mesmo app.** Campanhas ensinam, apps antigolpe protegem e quizzes avaliam; o Anzol junta os três num fluxo único.
2. **Golpes brasileiros reais e atualizados.** O Radar transforma campanhas confirmadas em novos testes (Radar → teste).
3. **Um motor único de sinais.** A pista que o jogo ensina é a mesma que o scanner mostra.
4. **Procedimento de 4 perguntas,** apoiado em evidência: o pedido e o canal protegem mais que a aparência [F1].
5. **Primeiros socorros + Kit de provas:** cobre o "depois", que quase nenhum material educativo cobre.
6. **Ética visível:** "indicadores, nunca acusações"; o alerta é passivo; o scanner nunca abre links; a privacidade vem desde o projeto.
7. **Treino interativo, não aula passiva.** O estudo da UCSD mostrou efeito só em módulos interativos concluídos [F4]. O jogo premia **investigar**, não a rapidez.

### 4.1 Como as 4 tecnologias aparecem **na prática**

Sempre diremos o que é **regra** e o que é **IA**.

| Requisito | No MVP | É IA ou regra? | Real ou simulado? |
|---|---|---|---|
| **Visão computacional** | OCR (leitura de texto em imagem) de prints no scanner, no Kit de provas e no relato do Radar; "impressão digital" de imagem (*perceptual hash* via canvas) para achar imagens reaproveitadas | Visão computacional clássica (OCR é um modelo treinado; o *hash* perceptual é algoritmo) | OCR com Tesseract.js se houver rede; senão, exemplo pré-extraído rotulado **SIMULAÇÃO** |
| **IA** | Agrupar variantes da mesma campanha por similaridade de texto (n-gramas/TF-IDF); detectar tendência de alta; escolher o próximo teste pela pista mais errada; explicações em linguagem simples, **pré-geradas e guardadas** (custo baixo) | IA leve / aprendizado estatístico (sem modelo pago) | Real em escala pequena, com dados semeados |
| **Análise de dados** | Banco de indicadores, painel por região e tipo, funil do golpe, teste inicial × reteste | Estatística descritiva | Painel com dados de demonstração (**SIMULAÇÃO**) |
| **Cloud** | Site estático no **GitHub Pages**; banco do Radar opcional em Postgres gerenciado (Supabase); consulta à idade do domínio pelo RDAP do Registro.br | Infraestrutura | Hospedagem real; banco em nuvem "se der tempo" |
| *(Regras)* | Scanner: domínio parecido, subdomínio enganoso, homóglifos, `xn--`, encurtador, IP, `@`, hífens, final incomum; urgência, ameaça, pedido de código/Pix, canal incompatível | **Regra**, não IA | Real |

---

## 5. Arquitetura em nuvem

```
[Celular / navegador do cidadão]
   │  HTML + CSS + JS puros (PWA opcional), estado do usuário em localStorage
   │  OCR e hash de imagem rodam NO APARELHO (privacidade)
   ▼
[GitHub Pages — site estático]            ← nuvem (hospedagem)
   │  app/data/*.json (sinais, cenários, Radar semeado)
   │
   ├──► [RDAP Registro.br] idade de domínios .br  (consulta direta do navegador; CORS liberado)
   ├──► [Supabase / Postgres] Radar: indicadores, relatos, campanhas  (opcional; senão JSON)
   └──► [Feeds de reputação: OpenPhish, PhishTank, URLhaus]  (roteiro futuro / SIMULAÇÃO)
```

**Limites verificados (05/11/2026):**
- **GitHub Pages** [F10]:
  - grátis em repositório público;
  - site até 1 GB;
  - limite flexível de 100 GB/mês de tráfego;
  - **não pode ser usado para negócio comercial**, o que basta para um protótipo acadêmico.
- **Supabase (plano gratuito)** [F11]:
  - banco de 500 MB e 2 projetos ativos;
  - o projeto **pausa após 1 semana sem uso**. Risco para a demonstração: acessar o projeto antes de gravar, ou manter o Radar em JSON;
  - fonte secundária; conferir na página oficial de preços.
- **RDAP do Registro.br** (testado por nós em 05/11/2026):
  - responde com `Access-Control-Allow-Origin: *`, então o **navegador consegue consultar direto**;
  - devolve a data de registro no evento `registration` (ex.: `registro.br` → 1999-02-21);
  - domínio inexistente → HTTP 404;
  - **vale só para domínios `.br`**. Os domínios de exemplo (`.test`/`.example`) usam idade **SIMULADA**.

---

## 6. Resultados e impacto esperados (critério 5 · **8 pontos**)

### 6.1 Indicadores

| Eixo | Indicador | Como medir no MVP |
|---|---|---|
| Comportamento | Taxa de "interação" (decisão errada em cenário de golpe) no **teste inicial × reteste** | O jogo registra no aparelho (localStorage) |
| Comportamento | Taxa de falso alarme em cenários **legítimos** (paranoia) | Idem; calibra confiança |
| Aprendizado | Pistas corretas marcadas por cenário; pista mais errada | Idem |
| Escudo | Passos do checklist concluídos (2FA, aparelhos conectados, Registrato, palavra de segurança) | Autodeclarado |
| Primeiros socorros | Tempo entre abrir a triagem e contatar o banco; uso do Kit de provas | Autodeclarado |
| Radar | Tempo entre o 1º relato e o alerta; % de relatos que já batiam com campanha conhecida; consultas do scanner que acionaram alerta; contestações aceitas (falsos positivos); duração média das campanhas | Dados semeados (**SIMULAÇÃO**) no MVP |

**Referência real** [F1]: 56% interagem e 25% dos que interagem perdem dinheiro. *Simulado e real não são diretamente comparáveis; usamos só como referência.*

### 6.2 Validação
- **No MVP:** testes automáticos do scanner (10 exemplos) e dos dados (`tests/validar-dados.ps1`).
- **Mini-piloto opcional:** 5 a 10 pessoas, com consentimento, anônimo e sem dado pessoal. **Sem valor estatístico, e diremos isso.**
- **Parâmetros de XP, limiares e pesos das pistas são valores iniciais SEM validação.**

### 6.3 Implementação (marcos)

| Quando | Entrega |
|---|---|
| 05–08/11 | Documento-base, escopo congelado, cenários e testes |
| 09–12/11 | Protótipo do caminho completo (checagem em 12/11) |
| 13–14/11 | Arquitetura, indicadores, SWOT e Cinco Forças, roteiro |
| 15–17/11 | Gravação e edição |
| 18/11 | Entrega (prazo final 19/11) |

### 6.4 Expansão
- Novos tipos de golpe: voz clonada, falso investimento em vários episódios.
- Notificação ativa (só para campanhas de alta confiança).
- Integração com canais de denúncia.
- Parcerias com bancos e operadoras.
- Feeds de reputação.
- Agrupamento por IA em maior escala.

### 6.5 Sustentabilidade (**HIPÓTESES**, sem preço validado)
- **Gratuito para o cidadão.**
- Financiado por bancos, fintechs, seguradoras e operadoras: educação digital de clientes, painel/API do Radar. Contexto: perdas dos bancos de R$ 10,1 bi em 2024 [F3].
- Prefeituras e escolas: programas de educação digital.
- Custo de operação baixo por projeto: regras primeiro, modelo leve depois, modelo pesado só em exceção, e explicações pré-geradas.

### 6.6 ODS (texto oficial conferido em brasil.un.org em 05/11/2026 [F12])

| ODS / meta | Tema oficial (resumo) | Contribuição do Anzol | Força do vínculo |
|---|---|---|---|
| **4.4** | Aumentar o número de jovens e adultos com habilidades relevantes | Competência prática de segurança digital (as 4 perguntas) | **Principal** |
| **10.2** | Inclusão social e econômica de todos, independentemente de idade, gênero, condição econômica etc. | Foco nos menos confiantes; acessível; gratuito | **Principal** |
| **16.4** | Reduzir fluxos financeiros ilegais e combater o crime organizado | Reduz a conversão do golpe em perda; o Radar ajuda a ver campanhas | **Complementar** (o ODS 16 não está na lista destacada do enunciado; usar como apoio) |
| **3.4** | Inclui promover a saúde mental e o bem-estar | 76% das vítimas relatam impacto no bem-estar [F1]; abordagem sem culpa; CVV | Secundário |
| **9.c** | Ampliar o acesso às TIC | Vínculo **fraco** (a meta trata de acesso e conectividade, com prazo em 2020). **Recomendação: não destacar no vídeo** | Fraco |

---

## 7. Riscos, ética e privacidade

**Regras inegociáveis do projeto:**
- marcas fictícias;
- nenhuma página falsa funcional;
- só domínios reservados;
- sem roteiro operacional de golpe;
- o scanner nunca abre links;
- sem dados pessoais reais;
- a linguagem dá "risco com motivos", nunca veredito;
- avisos fixos nos Primeiros socorros;
- revisão, contestação e prazo de validade para indicadores.

| Risco | Mitigação |
|---|---|
| Falso positivo acusa uma pessoa ou empresa | "Indicadores, nunca acusações"; telefone e chave Pix guardados como *hash* com segredo; revisão humana antes de "alerta ativo" para pessoa ou empresa; contestação e validade |
| Número de ligação falsificado (spoofing) | Confiança **baixa** para número de ligação; nunca alertar contra o número exibido |
| Abuso do relato (denúncia em massa) | Exigir relatos independentes, limite por usuário, não expor limiares |
| Sensação falsa de segurança | Aviso fixo de que "a proteção não é perfeita"; nada de "você está protegido" |
| Conteúdo vira manual de golpe | Descrição só do padrão; mensagens curtas e fictícias; sem links clicáveis |
| LGPD | Base usual para prevenção à fraude: legítimo interesse (art. 7º, IX), com teste de balanceamento. **Premissa que precisa de validação jurídica.** Prova da vítima fica privada; OCR roda no aparelho |
| Uso de material de terceiros | A Cartilha do CERT.br é **CC BY-NC-ND 4.0**, que **proíbe obras derivadas** [F13]. Escrevemos conteúdo **próprio** e só **indicamos o link** da Cartilha |
| Dados desatualizados (as regras mudam) | Cada cartão do Escudo mostra fonte e data da última verificação |

---

## 8. Fontes

| ID | Fonte | Verificado em |
|---|---|---|
| F1 | GASA — *O Estado dos Golpes Brasil 2026* (pesquisa online, 1.170 adultos, coleta 16/03–13/04/2026). https://static.poder360.com.br/uploads/2026/08/estudo-golpes-digitais-GASA-O-Estado-dos-Golpes-Brasil-2026-pdf.pdf | 04–05/11/2026 (conversa anterior) |
| F2 | Anuário Brasileiro de Segurança Pública 2026, via Olhar Digital. https://olhardigital.com.br/2026/07/23/seguranca/o-golpe-que-mais-cresce-no-brasil-esta-no-seu-celular-entenda/ | 04–05/11/2026 |
| F3 | Febraban e FBSP/Datafolha, via imprensa (ranking IPESPE: Folha BV). https://www.folhabv.com.br/policia/do-golpe-do-pix-a-falsa-central-bancaria-entenda-como-funciona-as-fraudes/ | 04–05/11/2026; relatório original **A CONFIRMAR** |
| F4 | UC San Diego Health, via Tecnoblog. https://tecnoblog.net/noticias/aulas-contra-phishing-nao-funcionam-como-o-esperado-diz-estudo/ | 04–05/11/2026 |
| F5 | Regras contra golpes por SMS (04/11/2026): Ministério das Comunicações https://www.gov.br/mcom/pt-br/noticias/2026/novembro/ministerio-das-comunicacoes-destaca-novas-medidas-para-combater-golpes-por-sms-e-proteger-consumidores · Olhar Digital https://olhardigital.com.br/2026/11/04/seguranca/governo-cria-regras-contra-golpes-por-sms-veja-o-que-muda | 05/11/2026 (trechos via busca) |
| F6 | MED/Pix: Agência Brasil https://agenciabrasil.ebc.com.br/economia/noticia/2026-09/nova-regra-do-pix-amplia-prazo-para-contestar-golpe · Nubank https://blog.nubank.com.br/mecanismo-especial-de-devolucao-pix-como-funciona/ | 04–05/11/2026 |
| F7 | CVV: 188, gratuito, 24 h; chat e e-mail em cvv.org.br (a disponibilidade dos outros canais varia). https://cvv.org.br | 05/11/2026 (via busca) |
| F8 | WhatsApp clonado (guias secundários; Central de Ajuda oficial **A CONFIRMAR**). https://www.xataka.com.br/telefonia/que-fazer-se-hackearem-sua-conta-do-whatsapp | 05/11/2026 |
| F9 | Registrato: https://viva.com.br/dinheiro/banco-central-cria-nova-ferramenta-para-evitar-fraudes-com-chaves-pix.html | 04–05/11/2026 |
| F10 | GitHub Pages limits. https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits | 05/11/2026 |
| F11 | Supabase pricing. https://supabase.com/pricing (via busca; conferir na página) | 05/11/2026 |
| F12 | ODS — Nações Unidas no Brasil. https://brasil.un.org/pt-br/sdgs/4 · /10 · /16 · /3 · /9 | 05/11/2026 |
| F13 | Cartilha de Segurança para Internet — licença CC BY-NC-ND 4.0. https://cartilha.cert.br/ | 05/11/2026 |
| F14 | Golpe da CNH — Associação Nacional dos Detrans (nov/2024; 18 estados + DF). https://www.portaldotransito.com.br/noticias/and-faz-alerta-para-golpe-com-mensagens-falsas-sobre-suspensao-de-cnh/amp/ | 05/11/2026 (via busca) |
| F15 | Falso advogado — OAB-SP: 4.388 denúncias no estado até fev/2026. https://www.oabsp.org.br/noticia/26-02-06-1718-golpe-do-falso-advogado-ja-soma-4388-denuncias-e-acende-alerta-em-todo-o-pais · OAB Nacional (29/04/2025): 1,6 mil em SP desde 2024 e plataforma ConfirmADV. https://www.oab.org.br/noticia/63063/oab-lanca-campanha-nacional-e-plataforma-de-verificacao-contra-golpe-do-falso-advogado · Caso TRF6 (27/04/2026). https://portal.trf6.jus.br/golpe-do-falso-advogado-utiliza-dados-reais-para-enganar-vitimas/ | 05/11/2026 (páginas OAB e TRF6 lidas) |
| F16 | Anatel — Resolução 777/2025, autenticação de chamadas. https://olhardigital.com.br/2024/09/23/seguranca/anatel-estabelece-novas-medidas-contra-fraudes-e-golpes-telefonicos/ | 04–05/11/2026 |

**Notas sobre o falso advogado** (detalhes em `docs/a-confirmar.md`):
- "1,6 mil denúncias" é da OAB Nacional (abr/2025), para SP desde 2024. **No vídeo, usar o dado mais recente: 4.388 denúncias até fev/2026 (OAB-SP)** [F15].
- **Caso TRF6** [F15]: uma servidora do tribunal recebeu a abordagem com dados verdadeiros do processo dela. Escapou porque **sabia quem era o advogado dela** e recusou abrir o link. Não dizer que ela "ligou para o advogado".
- Para "Como confirmo?": a OAB oferece a plataforma **ConfirmADV**, que confirma se o advogado é real.
