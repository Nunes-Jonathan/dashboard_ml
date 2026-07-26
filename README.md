# Painel de Telemetria — Frota Offline

Dashboard Next.js que lê ao vivo as abas **Relação Geral** e **AGENDAMENTO** da
planilha Google Sheets "Telemetria Offlines Geral" e mostra status da frota e
triagem de chamados.

## Como funciona

- Os dados são buscados no servidor via o export CSV público da planilha
  (`/gviz/tq?tqx=out:csv&sheet=<nome>`) — não precisa de credenciais do Google,
  desde que a planilha continue com link de visualização compartilhado.
- `lib/sheets.ts` busca e parseia as duas abas.
- `lib/metrics.ts` calcula os agregados (contagens, faixas de dias offline,
  KPIs, tabela de ação unindo as duas abas pela placa).
- A página (`app/page.tsx`) revalida a cada 5 minutos (ISR). O botão
  "Atualizar dados" força uma revalidação imediata via `app/api/refresh`.
- Só entram no painel de frota as linhas com `Visibilidade Dash = Sim` na
  planilha — esse é o filtro que a própria planilha já usa para marcar o que
  deve aparecer em um dashboard.

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

## Deploy na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com/new, importe o repositório.
3. (Opcional) defina `NEXT_PUBLIC_GOOGLE_SHEET_ID` nas Environment Variables
   do projeto na Vercel se for usar uma planilha diferente da padrão.
4. Deploy — nenhum outro segredo é necessário, já que a planilha é lida via
   export público.

Alternativa via CLI, sem precisar de Git:

```bash
npm install -g vercel
vercel login
vercel
```
