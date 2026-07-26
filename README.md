# Painel de Telemetria — Frota Offline

Dashboard Next.js com três páginas:

- **`/`** — lê ao vivo as abas **Relação Geral** e **AGENDAMENTO** da planilha
  Google Sheets "Telemetria Offlines Geral" e mostra status da frota e
  triagem de chamados.
- **`/frota-offline`** — versão mais completa, cruzando a base completa de
  frota offline da API pública de `telemetria-dashboard-one.vercel.app`
  (BigQuery, cobre toda a frota, não só o que está na nossa planilha) com a
  aba **AGENDAMENTO**. Traz tendência de 60 dias, quebra por regional/
  sub-regional/transportadora/SVC, e uma lista de veículos em manutenção com
  risco de voltar offline.
- **`/geotab`** — direto da fonte mais upstream de todas: o conector OData da
  Geotab (fabricante do rastreador). Conectividade nativa (`Device_Health`),
  falhas ativas por veículo, tendência de 7 dias, e cruzamento com
  **AGENDAMENTO**. Exige credenciais (ver Configuração).

## Como funciona

- Os dados da planilha são buscados no servidor via o export CSV público
  (`/gviz/tq?tqx=out:csv&sheet=<nome>`) — não precisa de credenciais do
  Google, desde que a planilha continue com link de visualização
  compartilhado. `lib/sheets.ts` busca e parseia as duas abas.
- Os dados da API externa (`/frota-offline`) são buscados em
  `lib/externalTelemetria.ts` — endpoints públicos, sem autenticação. A
  consulta de risco de manutenção é mais lenta/instável no servidor deles,
  então é buscada com timeout e cai para uma mensagem de "indisponível" em
  vez de derrubar a página.
- Os dados da Geotab (`/geotab`) são buscados em `lib/geotab.ts` via HTTP
  Basic Auth (usuário no formato `database/username`). Alguns detalhes não
  óbvios da API, descobertos testando diretamente:
  - O endpoint público redireciona para um servidor por conta (ex.
    `odata-connector-5.geotab.com`) — seguir esse redirect direto pelo
    `fetch` do Node se mostrou instável (403 intermitente); por isso o código
    resolve esse endereço uma vez e reusa.
  - `LatestVehicleMetadata` guarda o **histórico** de vínculos veículo↔
    dispositivo, não só o atual — cerca de 73% das linhas são registros
    antigos. Só a linha com `DateTo = 2050-01-01` (sentinela de "vigente") é
    o estado atual; ignorar isso derruba o % de offline calculado.
  - `DeviceGroups` é uma tabela enorme (300 mil+ linhas, hierarquia
    organizacional completa) — o código busca só os 4 prefixos que
    interessam (`SVC_`, `MLP_`, `LOC_`, `Regional`) via `$filter=startswith(...)`.
  - `VehicleKpi_Daily` (usado na tendência) só guarda ~7 dias de histórico.
  - A consulta de risco de manutenção e a de tendência diária são grandes/
    lentas — têm timeout próprio e viram lista vazia em vez de derrubar a
    página se demorarem demais.
- `lib/metrics.ts` / `lib/offlineMetrics.ts` / `lib/geotabMetrics.ts` calculam
  os agregados (contagens, faixas de dias offline, KPIs, tabela de ação
  unindo as fontes pela placa).
- Cada página revalida periodicamente (ISR: 5 min em `/`, ~5–10 min nas
  outras, o menor entre os `fetch`es da página). O botão "Atualizar dados"
  força uma revalidação imediata via `app/api/refresh`.
- Só entram no painel de frota (página `/`) as linhas com
  `Visibilidade Dash = Sim` na planilha — esse é o filtro que a própria
  planilha já usa para marcar o que deve aparecer em um dashboard.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Configuração

Por padrão o app aponta para a planilha original (ID
`1cXG0i1o2agxd2OBZ56sEVPQ3PnOGFV4KyH0QCVrXBRI`). Para apontar para outra
planilha (mesma estrutura de abas/colunas), defina a variável de ambiente:

```
NEXT_PUBLIC_GOOGLE_SHEET_ID=<id-da-planilha>
```

A página `/geotab` precisa de credenciais do conector OData da Geotab
(servidor apenas — nunca use prefixo `NEXT_PUBLIC_` nestas, e nunca as
importe de um arquivo `"use client"`):

```
GEOTAB_DATABASE=<nome-do-banco>
GEOTAB_USERNAME=<usuario>
GEOTAB_PASSWORD=<senha>
```

Localmente essas 3 variáveis já estão em `.env.local` (arquivo ignorado pelo
git — nunca é commitado).

## Deploy na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
   `.env.local` não vai junto (está no `.gitignore`) — as credenciais da
   Geotab precisam ser configuradas de novo direto na Vercel, no passo 3.
2. Em https://vercel.com/new, importe o repositório.
3. Nas Environment Variables do projeto na Vercel, defina
   `GEOTAB_DATABASE` / `GEOTAB_USERNAME` / `GEOTAB_PASSWORD` (obrigatório para
   `/geotab` funcionar) e, opcionalmente, `NEXT_PUBLIC_GOOGLE_SHEET_ID` se for
   usar uma planilha diferente da padrão.
4. Deploy — a planilha e a API de telemetria externa são lidas via acesso
   público, sem segredo adicional; só a Geotab exige as credenciais acima.

Alternativa via CLI, sem precisar de Git:

```bash
npm install -g vercel
vercel login
vercel
```
