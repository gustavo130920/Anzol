# Cenários e testes do Anzol

> **SIMULAÇÃO — material educativo.** Organizações, pessoas, números e domínios são fictícios. Domínios usam só `.test`, `.example` ou `.invalid`. Nenhum link é clicável.
> Gerado automaticamente de `app/data/scenarios.json` (versão 0.1.0, 2026-11-05). **Status: RASCUNHO — aguardando revisão do conteúdo de segurança pelo usuário**

**Resumo:** 12 cenários (8 golpes, 4 legítimos) · 4 testes de domínio · 3 testes de procedimento.

| ID | Título | Linha | Tipo | Nível | Canal |
|---|---|---|---|---|---|
| L1-01 | Liquidação imperdível | 1 | golpe | 1 | anuncio_rede_social |
| L1-02 | O comprovante chegou, o dinheiro não | 1 | golpe | 2 | whatsapp |
| L1-03 | Vaga dos sonhos com taxa de entrada | 1 | golpe | 2 | whatsapp |
| L1-04 | Código que você pediu | 1 | legítima | 1 | sms |
| L2-01 | Troquei de número | 2 | golpe | 1 | whatsapp |
| L2-02 | Seu processo foi liberado | 2 | golpe | 3 | whatsapp |
| L2-03 | Ligação da central de segurança | 2 | golpe | 3 | ligacao_transcricao |
| L2-04 | Amiga combinando a apresentação | 2 | legítima | 2 | whatsapp |
| L3-01 | CNH será suspensa em 24h | 3 | golpe | 1 | sms |
| L3-02 | Dinheiro esquecido no seu nome | 3 | golpe | 2 | sms |
| L3-03 | Seu pedido saiu para entrega | 3 | legítima | 2 | sms |
| L3-04 | Lembrete de fatura | 3 | legítima | 3 | sms |

## Linha 1 · Pix, boleto, loja e trabalho

### L1-01 — Liquidação imperdível (GOLPE · nível 1)

- **Organização (fictícia):** Loja Vitrine (site oficial fictício: lojavitrine.example)
- **Canal:** anuncio_rede_social
- **Contexto:** Consulta simulada de idade do domínio: criado há 6 dias.

> Anúncio patrocinado — Liquidação de fábrica Loja Vitrine: tênis de R$ 499 por R$ 89. Só hoje! Pagamento apenas por Pix, com 10% de desconto.

**Endereço exibido:** `lojavitrine-oficial-liquida.test`

| Pista | Trecho | Por que importa |
|---|---|---|
| Oferta boa demais | R$ 499 por R$ 89 | Desconto de mais de 80% é isca. Oferta boa demais foi o motivo de 31% de quem desistiu de pagar (GASA 2026). |
| Urgência | Só hoje! | O prazo curto existe para você não pesquisar. |
| Pede Pix ou pagamento | Pagamento apenas por Pix | Só aceitar Pix tira de você a proteção do cartão e da plataforma. |
| Muitos hífens ou endereço longo | `lojavitrine-oficial-liquida.test` | O site oficial é lojavitrine.example. Palavras como 'oficial' coladas com hífen não tornam nada oficial. |
| Site criado há poucos dias | criado há 6 dias | Loja grande não nasce na semana passada. |

**4 perguntas:** Quem pede? Um anúncio que diz ser da Loja Vitrine, mas aponta para outro endereço. · O que pede? Pagamento só por Pix, com desconto extra para Pix. · Por onde veio? Anúncio em rede social, levando a um domínio diferente do oficial. · Como confirmo? Abrir o app ou digitar o endereço oficial da loja e procurar a promoção lá.

**Decisão certa:** Não comprar por esse anúncio; procurar a loja pelo endereço/app que você já conhece.

**Feedback:** A aparência do site não prova nada: copiar fotos e logotipo é fácil. O que entrega é o pedido (só Pix) e o endereço diferente do oficial.

*Baseado em:* Compras é o tipo de golpe com mais interações (22%) no relatório GASA 2026; relatos de anúncios que levam a sites idênticos aos de marcas conhecidas. *Fonte:* <https://static.poder360.com.br/uploads/2026/08/estudo-golpes-digitais-GASA-O-Estado-dos-Golpes-Brasil-2026-pdf.pdf> — verificado em 2026-11-05 (dados da pesquisa inicial, 04–05/11/2026)

### L1-02 — O comprovante chegou, o dinheiro não (GOLPE · nível 2)

- **Organização (fictícia):** Você é quem vende (pessoa física, anúncio em marketplace fictício)
- **Canal:** whatsapp

> Pronto, fiz o Pix de R$ 350, segue o comprovante. Pode despachar hoje? Estou com pressa.

*Imagem:* Imagem estática de comprovante fictício com o selo 'SIMULAÇÃO'. O status diz 'agendado' em letra pequena; o valor ainda não aparece no seu extrato.

| Pista | Trecho | Por que importa |
|---|---|---|
| Comprovante que não confere | status 'agendado' / valor fora do extrato | Pix cai na hora. Comprovante é só uma imagem; o que vale é o extrato do seu banco. |
| Urgência | Estou com pressa | A pressa é para você entregar antes de conferir. |
| Pagamento fora da plataforma | negociação pelo WhatsApp | A conversa saiu do marketplace, onde haveria registro e mediação. |

**4 perguntas:** Quem pede? Um comprador que você não conhece. · O que pede? Que você entregue o produto antes de o dinheiro aparecer. · Por onde veio? WhatsApp, fora da plataforma de vendas. · Como confirmo? Abrir o app do seu banco e ver o crédito no extrato.

**Decisão certa:** Não entregar nada até o valor aparecer no extrato do seu próprio banco.

**Feedback:** Comprovante pode ser editado, agendado e cancelado depois. Regra simples: só entregue depois de ver o valor no seu extrato.

*Baseado em:* Golpe do comprovante falso/agendado contra vendedores; orientações de bancos e fintechs para conferir sempre o extrato. *Fonte:* <https://blog.nubank.com.br/comprovante-de-pix-falso-como-identificar-esse-golpe/> — verificado em 2026-11-05 (trecho via busca; página não lida na íntegra)

### L1-03 — Vaga dos sonhos com taxa de entrada (GOLPE · nível 2)

- **Organização (fictícia):** Avalia Fácil Exemplo (empresa fictícia)
- **Canal:** whatsapp

> Olá! Seu perfil foi selecionado para vaga home office de avaliador de produtos, R$ 300 por dia. Para ativar seu cadastro, pague a taxa do kit de treinamento de R$ 49,90.

| Pista | Trecho | Por que importa |
|---|---|---|
| Contato que você não pediu | Seu perfil foi selecionado | Você não se candidatou a essa vaga. |
| Oferta boa demais | R$ 300 por dia | Ganho alto para tarefa simples é isca. |
| Taxa para liberar valor | pague a taxa do kit | Empresa séria não cobra para contratar. Pagar para trabalhar é o sinal central. |

**4 perguntas:** Quem pede? Uma 'empresa' que você nunca procurou. · O que pede? Uma taxa antes de qualquer trabalho. · Por onde veio? Mensagem direta, sem processo seletivo. · Como confirmo? Procurar a empresa por conta própria (CNPJ, site, canais de vaga conhecidos) e desconfiar de qualquer cobrança.

**Decisão certa:** Não pagar nada para 'liberar' vaga, prêmio ou valor; ignorar e, se quiser, denunciar.

**Feedback:** Taxa para liberar vaga, prêmio ou valor é o mesmo padrão em vários golpes. Quem paga para receber normalmente só perde.

*Baseado em:* Falsa vaga de emprego está entre os tipos com mais interações (17%) no relatório GASA 2026. *Fonte:* <https://static.poder360.com.br/uploads/2026/08/estudo-golpes-digitais-GASA-O-Estado-dos-Golpes-Brasil-2026-pdf.pdf> — verificado em 2026-11-05 (dados da pesquisa inicial, 04–05/11/2026)

### L1-04 — Código que você pediu (LEGÍTIMA · nível 1)

- **Organização (fictícia):** Banco Exemplar (fictício)
- **Canal:** sms
- **Contexto:** Você acabou de tentar entrar no app do Banco Exemplar no seu celular.

> Banco Exemplar: seu código de acesso é 482913. Não compartilhe este código com ninguém. O Banco Exemplar nunca pede este código por ligação ou mensagem.

| Pista | Trecho | Por que importa |
|---|---|---|
| Canal que você já esperava | você acabou de pedir | O código chegou porque VOCÊ iniciou o acesso. |
| Avisa para não compartilhar código | Não compartilhe este código | Mensagens legítimas de código avisam que ninguém deve pedi-lo. |
| Sem link nem pedido de pagamento | sem link | Não há link nem pedido de pagamento. |

**4 perguntas:** Quem pede? O banco, num momento em que você mesmo pediu o código. · O que pede? Nada: só informa o código para você digitar no seu próprio app. · Por onde veio? SMS, logo depois da sua ação. · Como confirmo? Você está no app oficial esperando o código.

**Decisão certa:** Parece legítima. Pode seguir, conferindo pelo canal que você já usa se algo mudar.

**Feedback:** Legítima. Mas atenção: se esse código chegar SEM você ter pedido, alguém está tentando entrar na sua conta. Não repasse para ninguém.

*Baseado em:* Padrão comum de SMS de verificação de bancos e apps; cenário de calibração (evitar paranoia). *Fonte:* sem fonte externa (cenário de calibração)

## Linha 2 · Mensagem de "conhecido" ou instituição

### L2-01 — Troquei de número (GOLPE · nível 1)

- **Organização (fictícia):** Contato desconhecido usando foto de um familiar
- **Canal:** whatsapp

> Oi mãe, troquei de número, salva esse. Tô com um problema e preciso de um Pix urgente, te explico depois.

| Pista | Trecho | Por que importa |
|---|---|---|
| Número novo ou desconhecido | troquei de número | Número novo + pedido de dinheiro é o começo clássico desse golpe. |
| Apelo afetivo | Oi mãe | A intimidade é usada para pular a desconfiança. |
| Urgência | urgente | Pressa para não dar tempo de confirmar. |
| Pede Pix ou pagamento | preciso de um Pix | O pedido de dinheiro é o que importa, não a foto do perfil. |
| Foge de confirmação | te explico depois | Evita dar detalhes que você poderia checar. |

**4 perguntas:** Quem pede? Alguém que DIZ ser seu filho, num número que você não conhece. · O que pede? Um Pix urgente. · Por onde veio? Número novo no WhatsApp. · Como confirmo? Ligar para o número antigo, falar com alguém da família ou pedir a palavra de segurança combinada.

**Decisão certa:** Não pagar ainda; confirmar com a pessoa por um caminho que você já tinha (número antigo, ligação, palavra de segurança).

**Feedback:** Ligue para o número que você já tinha. Se for mesmo seu filho, ele vai entender. Combine uma palavra de segurança em família: em 2026 já há versões com voz clonada.

*Baseado em:* Golpe do falso parente/WhatsApp; 'Falso conhecido no WhatsApp' citado por 34% de quem sofreu golpe ou tentativa (Observatório Febraban/IPESPE, jun/2025, 3.000 entrevistas). *Fonte:* <https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/observatorio%20julho%202025.pdf> — verificado em 2026-11-05 (relatório original lido em 06/11/2026)

### L2-02 — Seu processo foi liberado (GOLPE · nível 3)

- **Organização (fictícia):** Escritório Exemplo Advocacia (fictício); cliente 'Maria' (nome fictício)
- **Canal:** whatsapp
- **Contexto:** Você realmente tem um processo em andamento. A mensagem veio de um número que não é o do seu advogado, com a foto e o nome do escritório.

> Escritório Exemplo Advocacia: Sra. Maria, o valor de R$ 18.400 do seu processo nº 0000000-00.0000.0.00.0000 foi liberado. Para a expedição, é necessário recolher custas de R$ 1.150 via Pix até hoje.

| Pista | Trecho | Por que importa |
|---|---|---|
| Autoridade | Escritório … processo nº | Número de processo e nome do escritório dão ar oficial. Dados de processo podem ser públicos ou vazados. |
| Taxa para liberar valor | recolher custas de R$ 1.150 via Pix | Pagar para 'liberar' valor é o centro do golpe, segundo alertas da OAB-SP. |
| Urgência | até hoje | O prazo impede você de falar com seu advogado. |
| Número novo ou desconhecido | número que não é o do seu advogado | O contato não é o que você já tinha. |

**4 perguntas:** Quem pede? Alguém usando nome e foto do escritório, por um número diferente. · O que pede? Um Pix para 'liberar' o valor. · Por onde veio? WhatsApp, número novo. · Como confirmo? Ligar para o seu advogado pelo telefone que você já tinha, ir ao escritório ou usar a plataforma de confirmação de advogados da OAB (ConfirmADV).

**Decisão certa:** Falar com o seu advogado/empresa pelo contato que VOCÊ já tinha, não pelo que veio na mensagem.

**Feedback:** Saber o número do seu processo não prova nada: dados processuais podem ser consultados ou vazados. Antes de qualquer pagamento, fale com o seu advogado pelo contato que você já tinha.

*Baseado em:* Alertas da OAB-SP, TRF3 e TRF6 sobre o golpe do falso advogado: dados reais do processo + pedido de Pix como 'taxa' para liberar valores. OAB-SP: 4.388 denúncias no estado até fev/2026. Caso TRF6 (abr/2026): servidora escapou porque sabia quem era seu advogado e recusou o link. *Fonte:* <https://www.oabsp.org.br/noticia/26-02-06-1718-golpe-do-falso-advogado-ja-soma-4388-denuncias-e-acende-alerta-em-todo-o-pais> — verificado em 2026-11-05 (trecho via busca; página não lida na íntegra)

### L2-03 — Ligação da central de segurança (GOLPE · nível 3)

- **Organização (fictícia):** Banco Exemplar (fictício)
- **Canal:** ligacao_transcricao
- **Contexto:** O número que aparece na tela é igual ao do verso do seu cartão.

> [Transcrição] "Aqui é da central de segurança do Banco Exemplar. Identificamos uma compra suspeita de R$ 2.300 no seu cartão. Para cancelar, vou enviar um código por SMS e preciso que a senhora me confirme."

| Pista | Trecho | Por que importa |
|---|---|---|
| Ameaça ou medo | compra suspeita de R$ 2.300 | O susto faz você querer resolver na hora. |
| Pede código ou senha | preciso que a senhora me confirme [o código] | Banco não pede código nem senha por ligação. Esse é o sinal decisivo. |
| Número exibido pode ser falso | número igual ao do cartão | O número exibido pode ser falsificado (spoofing). |
| Autoridade | central de segurança | Nome de setor oficial para não ser questionado. |

**4 perguntas:** Quem pede? Alguém que diz ser do banco. Você não tem como saber pela ligação. · O que pede? O código que chegou por SMS. · Por onde veio? Ligação que você recebeu (não foi você quem ligou). · Como confirmo? Desligar e ligar você mesmo para o número do verso do cartão ou abrir o app do banco.

**Decisão certa:** Desligar e ligar você mesmo para o número oficial (verso do cartão ou app).

**Feedback:** Desligue e ligue você. Se a compra suspeita existir, o banco também vai ver pelo seu contato. A Anatel vem exigindo autenticação de chamadas, mas a implementação leva tempo.

*Baseado em:* Falsa central (31% de quem sofreu golpe ou tentativa — Observatório Febraban/IPESPE, jun/2025); Anatel Res. 777/2025 sobre autenticação de chamadas. *Fonte:* <https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/observatorio%20julho%202025.pdf> — verificado em 2026-11-05 (dados da pesquisa inicial, 04–05/11/2026)

### L2-04 — Amiga combinando a apresentação (LEGÍTIMA · nível 2)

- **Organização (fictícia):** Ana (nome fictício), colega de faculdade
- **Canal:** whatsapp
- **Contexto:** Número salvo há anos; vocês combinaram o projetor na aula de ontem.

> Oi! Vi que a apresentação ficou para sexta. Levo o projetor que combinamos? Se preferir, me liga.

| Pista | Trecho | Por que importa |
|---|---|---|
| Contexto que você consegue checar | o projetor que combinamos | Fala de algo que vocês combinaram e que você pode checar. |
| Canal que você já esperava | número salvo há anos | É o contato que você já tinha. |
| Sem link nem pedido de pagamento | sem pedido | Não pede dinheiro, código nem dado. |

**4 perguntas:** Quem pede? Uma colega, pelo número que você já conhece. · O que pede? Nada além de combinar algo que já existia. · Por onde veio? WhatsApp, contato antigo. · Como confirmo? Ela mesma oferece ligar.

**Decisão certa:** Parece legítima. Pode seguir, conferindo pelo canal que você já usa se algo mudar.

**Feedback:** Legítima. Desconfiar de tudo cansa e atrapalha. Os sinais de alerta aparecem quando surge um PEDIDO (dinheiro, código, dado) ou um canal novo.

*Baseado em:* Cenário de calibração (cerca de 1/3 legítimos, hipótese de design). *Fonte:* sem fonte externa (cenário de calibração)

## Linha 3 · Link, site e SMS

### L3-01 — CNH será suspensa em 24h (GOLPE · nível 1)

- **Organização (fictícia):** Departamento Estadual de Trânsito Exemplo — DETEX (fictício; site oficial fictício: detex.example)
- **Canal:** sms

> DETEX informa: sua CNH será SUSPENSA em 24h por pendência. Regularize agora: `regulariza-cnh-detex.test`

**Endereço exibido:** `regulariza-cnh-detex.test`

| Pista | Trecho | Por que importa |
|---|---|---|
| Canal que não combina | SMS com link de regularização | Segundo a Associação Nacional dos Detrans, nenhum Detran notifica suspensão por SMS com link; usam correspondência, carteira digital ou Diário Oficial. |
| Ameaça ou medo | será SUSPENSA | Ameaça de perder a habilitação. |
| Urgência | em 24h | Prazo curto para você não consultar o órgão. |
| Muitos hífens ou endereço longo | `regulariza-cnh-detex.test` | O site oficial é detex.example. Este é outro domínio, montado com palavras-chave. |
| Autoridade | DETEX informa | Usa o nome do órgão para parecer oficial. |

**4 perguntas:** Quem pede? Alguém usando o nome do órgão de trânsito. · O que pede? Que você 'regularize' por um link (no padrão real, cobram uma taxa). · Por onde veio? SMS com link, canal que o órgão não usa para isso. · Como confirmo? Consultar sua CNH no site ou app oficial do órgão, digitando o endereço você mesmo.

**Decisão certa:** Não clicar; consultar a situação pelo site/app oficial que você digita ou já usa.

**Feedback:** Mesmo que o site mostre seus dados verdadeiros (isso acontece no golpe real), ele não é oficial. Dados vazam; o canal não mente.

*Baseado em:* Alerta da Associação Nacional dos Detrans (nov/2024): casos em 18 estados + DF; mensagens com link para página que imita sistema oficial e cobra 'taxa de regularização'. *Fonte:* <https://www.portaldotransito.com.br/noticias/and-faz-alerta-para-golpe-com-mensagens-falsas-sobre-suspensao-de-cnh/amp/> — verificado em 2026-11-05 (trecho via busca; página não lida na íntegra)

### L3-02 — Dinheiro esquecido no seu nome (GOLPE · nível 2)

- **Organização (fictícia):** Programa Valores Esquecidos Exemplo (fictício)
- **Canal:** sms

> Programa Valores Esquecidos: há R$ 1.873,40 em seu nome. Para resgatar, confirme seus dados e pague a tarifa de transferência de R$ 19,90: `valores-esquecidos-resgate.test`

**Endereço exibido:** `valores-esquecidos-resgate.test`

| Pista | Trecho | Por que importa |
|---|---|---|
| Oferta boa demais | R$ 1.873,40 em seu nome | Dinheiro inesperado é o 2º tipo com mais interações (17%) no GASA 2026. |
| Taxa para liberar valor | pague a tarifa de transferência | Quem tem dinheiro para te devolver desconta a tarifa do valor, não pede que você pague antes. |
| Pede dados pessoais | confirme seus dados | Os dados digitados alimentam outros golpes. |
| Contato que você não pediu | SMS que você não esperava | Você não pediu consulta nenhuma. |
| Muitos hífens ou endereço longo | `valores-esquecidos-resgate.test` | Domínio montado com palavras-chave, sem relação com um órgão oficial. |

**4 perguntas:** Quem pede? Um 'programa' que você não conhece. · O que pede? Seus dados e uma tarifa antecipada. · Por onde veio? SMS com link. · Como confirmo? Procurar o serviço oficial pelo seu próprio caminho (site do órgão digitado por você, app do seu banco).

**Decisão certa:** Não clicar; consultar a situação pelo site/app oficial que você digita ou já usa.

**Feedback:** Serviços oficiais de valores a receber existem, mas você chega até eles pelo seu caminho, não por um link no SMS. E nunca paga para receber.

*Baseado em:* Categoria 'dinheiro inesperado' (17% das interações, GASA 2026). *Fonte:* <https://static.poder360.com.br/uploads/2026/08/estudo-golpes-digitais-GASA-O-Estado-dos-Golpes-Brasil-2026-pdf.pdf> — verificado em 2026-11-05 (dados da pesquisa inicial, 04–05/11/2026)

### L3-03 — Seu pedido saiu para entrega (LEGÍTIMA · nível 2)

- **Organização (fictícia):** Entregas Rápidas Exemplo e Loja Vitrine (fictícias)
- **Canal:** sms
- **Contexto:** Você comprou na Loja Vitrine (pelo app oficial) há 3 dias.

> Entregas Rápidas Exemplo: seu pedido da Loja Vitrine saiu para entrega hoje. Acompanhe pelo app da loja onde você comprou. Não cobramos taxas por mensagem.

| Pista | Trecho | Por que importa |
|---|---|---|
| Contexto que você consegue checar | seu pedido da Loja Vitrine | Você realmente fez essa compra. |
| Sem link nem pedido de pagamento | Acompanhe pelo app da loja | Manda você ao app que já usa, sem link nem cobrança. |
| Canal que você já esperava | aviso de entrega após compra | Faz sentido receber isso agora. |

**4 perguntas:** Quem pede? A transportadora de uma compra que você fez. · O que pede? Nada: só informa. · Por onde veio? SMS sem link. · Como confirmo? Abrir o app da loja e ver o status do pedido.

**Decisão certa:** Parece legítima. Pode seguir, conferindo pelo canal que você já usa se algo mudar.

**Feedback:** Legítima. Compare com o golpe da 'taxa de entrega': a diferença está no pedido (pagar) e no link.

*Baseado em:* Cenário de calibração (legítimo). *Fonte:* sem fonte externa (cenário de calibração)

### L3-04 — Lembrete de fatura (LEGÍTIMA · nível 3)

- **Organização (fictícia):** Banco Exemplar (fictício)
- **Canal:** sms
- **Contexto:** Você tem cartão do Banco Exemplar e a fatura costuma vencer no dia 10.

> Banco Exemplar: a fatura do seu cartão final 1234 vence em 10/12, valor R$ 842,15. Consulte e pague pelo app ou internet banking que você já usa. Não enviamos links de pagamento.

| Pista | Trecho | Por que importa |
|---|---|---|
| Sem link nem pedido de pagamento | Não enviamos links de pagamento | Manda você ao canal que já usa. |
| Contexto que você consegue checar | final 1234, vence em 10/12 | Dá para conferir no app se o valor e a data batem. |
| Canal que você já esperava | lembrete de fatura | Lembrete periódico de algo que você já tem. |

**4 perguntas:** Quem pede? Seu banco, falando de um cartão que você tem. · O que pede? Que você pague a fatura, mas pelo seu app. · Por onde veio? SMS sem link. · Como confirmo? Abrir o app do banco e comparar valor e vencimento.

**Decisão certa:** Parece legítima. Pode seguir, conferindo pelo canal que você já usa se algo mudar.

**Feedback:** Legítima, e nível 3 porque fala de dinheiro e prazo. A diferença para o golpe: não há link e você confere por conta própria.

*Baseado em:* Cenário de calibração (legítimo, sutil). *Fonte:* sem fonte externa (cenário de calibração)

## Testes de domínio ("qual é o endereço verdadeiro?")

### D-01 — Banco Exemplar (nível 1)

Qual destes endereços pertence de verdade ao Banco Exemplar (site oficial: `bancoexemplar.example`)?

| Endereço | Correto? | Sinais | Explicação |
|---|---|---|---|
| `bancoexemplar.example.atendimento-seguro.test` | não | Subdomínio enganoso, Muitos hífens ou endereço longo | O domínio de verdade é `atendimento-seguro.test`. O nome do banco está só no começo, de enfeite. |
| `internet.bancoexemplar.example` | **sim** | — | Termina em `bancoexemplar.example`: é um subdomínio do site oficial. |
| `bancoexemplar-seguranca.test` | não | Muitos hífens ou endereço longo, Final de endereço incomum | Outro domínio, com 'seguranca' colado por hífen e final diferente. |
| `bancoexernplar.example` | não | Letras parecidas, Nome parecido com o oficial | 'rn' no lugar de 'm': em letra pequena parecem iguais. |

**Lupa de domínio:** Leia o endereço da DIREITA para a ESQUERDA até o primeiro ponto antes do final. É ali que está o dono do site.

### D-02 — Departamento Estadual de Trânsito Exemplo (DETEX) (nível 1)

Você quer consultar sua CNH no DETEX (site oficial: `detex.example`). Qual endereço é o certo?

| Endereço | Correto? | Sinais | Explicação |
|---|---|---|---|
| `detex-cnh-regulariza.test` | não | Muitos hífens ou endereço longo, Final de endereço incomum | Palavras-chave com hífen e outro final. Não é o órgão. |
| `detex.example.consulta.test` | não | Subdomínio enganoso | O dono é `consulta.test`. |
| `servicos.detex.example` | **sim** | — | Termina em `detex.example`. |
| `detexx.example` | não | Nome parecido com o oficial | Uma letra a mais. Distância de uma letra do oficial. |

**Lupa de domínio:** O melhor caminho é não clicar: digite você mesmo o endereço oficial ou use o app.

### D-03 — Loja Vitrine (nível 2)

Três destes endereços imitam a Loja Vitrine (`lojavitrine.example`). Qual é o verdadeiro?

| Endereço | Correto? | Sinais | Explicação |
|---|---|---|---|
| `lojavitr1ne.example` | não | Letras parecidas | Número 1 no lugar da letra i. |
| `xn--lojavitrne-abc.test` | não | Endereço com 'xn--', Final de endereço incomum | 'xn--' indica letras de outro alfabeto que podem imitar letras comuns. (Exemplo ilustrativo.) |
| `lojavitrine.example` | **sim** | — | Igual ao oficial, letra por letra. |
| `lojavitrine.example-ofertas.test` | não | Subdomínio enganoso, Muitos hífens ou endereço longo | O dono é `example-ofertas.test`. |

**Lupa de domínio:** Compare letra por letra com o endereço que você já conhece. Desconfie de 1/l, 0/o e rn/m.

### D-04 — Prefeitura Exemplo (nível 3)

Qual destes leva de fato ao site da Prefeitura Exemplo (`prefeituraexemplo.example`)?

| Endereço | Correto? | Sinais | Explicação |
|---|---|---|---|
| `prefeituraexemplo.example@192.0.2.45/iptu` | não | @ no endereço, Número no lugar do nome | Tudo antes do @ é ignorado; o destino real é um número (IP). IP de documentação, fictício. |
| `encurta.test/a8Kp2` | não | Link encurtado | Link encurtado esconde o destino. Não dá para saber aonde leva sem abrir, e o Anzol nunca abre. |
| `servicos.prefeituraexemplo.example/iptu` | **sim** | — | Termina em `prefeituraexemplo.example` antes da primeira barra. |
| `prefeituraexemplo-iptu2026.test` | não | Muitos hífens ou endereço longo, Final de endereço incomum | Domínio diferente, com ano e assunto colados. |

**Lupa de domínio:** O que manda é o trecho entre '//' (ou o começo) e a primeira '/'. Se houver @, vale só o que vem depois dele.

## Testes de procedimento ("qual o próximo passo certo?")

### P-01 (nível 1 · pergunta-chave: Como confirmo por outro caminho?)

Chega mensagem de um número novo, com a foto da sua filha, pedindo um Pix urgente. Qual o próximo passo certo?

- ❌ **Fazer o Pix, porque a foto é dela.** — Foto de perfil qualquer um copia.
- ❌ **Perguntar pelo mesmo chat 'é você mesmo?'.** — Quem está do outro lado vai dizer que sim. Confirmar pelo mesmo canal não confirma.
- ✅ **Ligar para o número antigo dela ou pedir a palavra de segurança da família.** — Confirmar por OUTRO caminho é o que mais protege.
- ❌ **Bloquear sem avisar ninguém.** — Bloquear ajuda, mas avise a família: o golpista pode tentar com outros parentes.

### P-02 (nível 2 · pergunta-chave: Como confirmo por outro caminho?)

Você recebe ligação do 'banco'. O número na tela é igual ao do seu cartão. Pedem o código que acabou de chegar por SMS para 'cancelar uma compra'. O que fazer?

- ❌ **Passar o código, já que o número é o do banco.** — O número exibido pode ser falsificado. Banco não pede código.
- ✅ **Desligar e ligar você mesmo para o número do verso do cartão.** — Você controla o caminho. Se houver problema real, o banco resolve por ali.
- ❌ **Pedir o nome e a matrícula do atendente e continuar.** — Nome e matrícula podem ser inventados.
- ❌ **Passar só metade do código.** — Nenhuma parte do código deve ser compartilhada.

*Fonte:* <https://olhardigital.com.br/2024/09/23/seguranca/anatel-estabelece-novas-medidas-contra-fraudes-e-golpes-telefonicos/>

### P-03 (nível 2 · pergunta-chave: O que pede?)

Você percebeu que fez um Pix para um golpista há 20 minutos. Qual o primeiro passo?

- ✅ **Falar agora com o seu banco pelo app ou canal oficial e pedir a devolução pelo MED.** — Quanto antes, maior a chance de haver saldo para bloquear. O pedido pode ser feito até 80 dias após a transação, mas a pressa conta.
- ❌ **Procurar uma empresa que promete recuperar o dinheiro mediante taxa.** — Isso é o 'golpe da recuperação'. Ninguém deve pagar para recuperar.
- ❌ **Apagar a conversa com o golpista para esquecer.** — Não apague: prints e comprovantes são provas para o banco e o boletim de ocorrência.
- ❌ **Esperar até amanhã para ver se o dinheiro volta sozinho.** — O dinheiro costuma sair da conta de destino em minutos.

> O Anzol não promete recuperação de dinheiro e não dá aconselhamento jurídico.

*Fonte:* <https://agenciabrasil.ebc.com.br/economia/noticia/2026-09/nova-regra-do-pix-amplia-prazo-para-contestar-golpe>

## Decisões possíveis

- `nao_comprar_e_verificar_no_canal_oficial`: Não comprar por esse anúncio; procurar a loja pelo endereço/app que você já conhece.
- `conferir_no_extrato_antes_de_entregar`: Não entregar nada até o valor aparecer no extrato do seu próprio banco.
- `nao_pagar_taxa_e_ignorar`: Não pagar nada para 'liberar' vaga, prêmio ou valor; ignorar e, se quiser, denunciar.
- `confirmar_por_outro_canal`: Não pagar ainda; confirmar com a pessoa por um caminho que você já tinha (número antigo, ligação, palavra de segurança).
- `confirmar_com_quem_voce_ja_conhece`: Falar com o seu advogado/empresa pelo contato que VOCÊ já tinha, não pelo que veio na mensagem.
- `desligar_e_ligar_no_numero_oficial`: Desligar e ligar você mesmo para o número oficial (verso do cartão ou app).
- `ignorar_e_verificar_no_canal_oficial`: Não clicar; consultar a situação pelo site/app oficial que você digita ou já usa.
- `seguir_com_cuidado`: Parece legítima. Pode seguir, conferindo pelo canal que você já usa se algo mudar.
