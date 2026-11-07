# Anzol — SWOT e Cinco Forças de Porter

> Versão 1.0 · 06/11/2026. Cada item termina com a ação que ele exige ("→"). **HIPÓTESE** = sem validação de mercado.

## SWOT

### Forças (internas, a favor)

- **Aprender e se proteger no mesmo lugar:** treino, scanner, radar e pós-golpe num só app gratuito → usar isso como mensagem central do pitch.
- **Golpes brasileiros reais, com fonte e data** (Detrans, OAB-SP, Febraban/IPESPE, GASA) → manter a rotina de verificação (checklist "A CONFIRMAR").
- **Explicável:** o scanner mostra o risco e os motivos, nunca um veredito → diferencia de apps que só dizem "golpe/seguro".
- **Privacidade por desenho:** o link e as provas não saem do aparelho; telefone e Pix só como HMAC; relato só com consentimento → destacar como argumento de confiança (LGPD).
- **Custo por uso perto de zero:** processamento no aparelho e nuvem gratuita → viabiliza a gratuidade para o cidadão.
- **Acessível:** fonte para baixa visão, alto contraste, voz, tema claro/preto → reforça o ODS 10.2.

### Fraquezas (internas, contra)

- **Radar ainda local e semeado (SIMULAÇÃO):** sem rede real de relatos → próxima etapa: banco compartilhado na nuvem com moderação humana.
- **Conteúdo pequeno:** 19 itens de teste e 7 campanhas → criar rotina Radar → rascunho de teste → revisão.
- **Parâmetros sem validação** (XP, pesos do scanner, limiar de alerta) → piloto com 5–10 pessoas e ajuste por dados.
- **Sem usuários reais ainda** → piloto com consentimento antes de qualquer afirmação de eficácia.
- **Listas públicas atrasam** para endereços novos; **OCR pode errar** → manter regras locais como primeira camada e pedir conferência humana no Kit.

### Oportunidades (externas, a favor)

- **Regulação em movimento:** regras da Anatel contra SMS (Despacho nº 2/SCD, vigência a partir de ≈ fev/2027) e MED 2.0 (obrigatório desde 02/02/2026) aumentam a necessidade de orientar o cidadão → conteúdo do Escudo/Caí no golpe sempre atualizado com essas regras.
- **Fraudes e golpes no sistema bancário** (R$ 10,1 bi em 2024, Febraban via imprensa) → proposta de valor para financiadores (**HIPÓTESE**).
- **Hábito de checar já existe:** 26% perguntam a IA, 18% usam app antigolpe (GASA 2026) → entrar onde a pessoa já procura ajuda.
- **Educação digital** em prefeituras e escolas → parcerias institucionais.
- **Canais oficiais novos** (página "Sofri um golpe, e agora?" do Ministério da Justiça) → integrar como destino dos Primeiros socorros.

### Ameaças (externas, contra)

- **Golpes mudam rápido** (voz clonada, falso investimento) → Radar alimenta novos testes; expansão de conteúdo.
- **Concorrentes com escala:** Google "Evite Golpes" (gratuito) e apps de veredito por IA (GolpeZero) → competir pela combinação e pelo pós-golpe, não só pelo jogo ou pelo scanner.
- **Risco jurídico de uma base de indicadores** (falso positivo, LGPD) → "indicadores, nunca acusações", revisão humana, contestação, validade; validação jurídica (premissa declarada).
- **Abuso do relato** (denúncia em massa) → relatos independentes, limite por pessoa, limiares não expostos.
- **Fadiga de alertas** → alerta passivo por padrão; ativo só para campanhas confirmadas.
- **Dependência de serviços gratuitos** (GitHub, CDN, listas) → fallback local e versões fixadas.

## Cinco Forças de Porter

| Força | Intensidade | Por quê | O que o Anzol faz |
|---|---|---|---|
| **Rivalidade entre concorrentes** | Média | Mercado fragmentado: campanhas (Febraban), jogos (Google), apps de veredito (GolpeZero), treinamento B2B (Hacker Rangers). Nenhum combina treino + scanner explicável + radar + pós-golpe | Diferenciar pela combinação, pela explicação e pela confiança (privacidade) |
| **Ameaça de novos entrantes** | Alta para quiz/app de checagem; baixa para um radar com rede | Um quiz ou um "detector com IA" é fácil de copiar; uma base de indicadores alimentada por relatos independentes tem **efeito de rede** | Construir a base de relatos e as parcerias cedo; o Radar é o fosso |
| **Ameaça de substitutos** | Alta | Chatbots de IA gerais, avisos do próprio banco (alerta no Pix), campanhas | Ser complemento, não rival: explicar o porquê, cobrir o pós-golpe e indicar o canal oficial |
| **Poder dos fornecedores** | Baixo a médio | Hospedagem e CI gratuitas e substituíveis; dependência de listas públicas e da CDN do OCR | Versões fixadas, verificação de integridade, fallback local, troca de provedor simples |
| **Poder dos clientes** | Cidadão: alto (custo zero de troca). Financiadores: alto (poucos e grandes) | O cidadão abandona se não vir valor rápido; bancos e operadoras negociam forte | Para o cidadão: valor no primeiro uso (scanner + caí no golpe). Para financiadores: indicadores medidos (painel) e vários financiadores (bancos, operadoras, prefeituras) para não depender de um só (**HIPÓTESE**) |

## Frase de síntese (para o vídeo)

"Combinamos treino com golpes brasileiros reais, scanner com motivos, radar comunitário de indicadores e passo a passo depois do golpe — tudo gratuito e no mesmo lugar."
