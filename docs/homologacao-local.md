# Homologacao local com Atlas e HTTPS

Esta configuracao usa exclusivamente o database `erp_souza_homolog`. Os
databases `erpSouza` e `test` sao protegidos e nao devem ser consultados por
estes procedimentos. O nome `test` nunca e tratado como indicacao de ambiente
descartavel.

## 1. Pre-requisitos e variaveis

Copie `homolog.env.example` para `.env.homolog.local`. Esse destino ja e
ignorado pelo Git. Preencha localmente, sem enviar valores por chat:

- `MONGODB_URI`: URI Atlas com `/erp_souza_homolog` explicitamente no caminho;
- `AUTH_SECRET`: segredo aleatorio com pelo menos 32 caracteres;
- `OPENAI_API_KEY` e `OPENAI_MODEL`: necessarios somente para validar importacao
  assistida;
- `HOMOLOG_ADMIN_USERNAME` e `HOMOLOG_ADMIN_PASSWORD`: credenciais exclusivas
  da homologacao;
- `APP_ENV=homologation` e
  `HOMOLOGATION_DATABASE_CONFIRMED=erp_souza_homolog`: guardas obrigatorios.

Nao use `dbName` na query da URI. A conta Atlas deve ter somente as permissoes
necessarias sobre `erp_souza_homolog`. A configuracao nao altera access lists,
usuarios Atlas nem regras de rede.

Primeiro execute a verificacao somente leitura:

```bash
set -a
. ./.env.homolog.local
set +a
pnpm homolog:check
```

O comando informa apenas conectividade, topologia e quantidade de collections;
nao imprime host, usuario, senha ou URI. Se o database ja possuir collections,
confirme externamente que ele foi criado para esta homologacao antes de manter
`HOMOLOGATION_DATABASE_CONFIRMED` preenchida. Sem essa confirmacao, nenhum dos
comandos de escrita abaixo deve ser executado.

## 2. Indices e administrador inicial

Revise primeiro o dry-run de indices:

```bash
pnpm audit:indexes -- --database erp_souza_homolog
```

Depois da revisao e confirmacao de finalidade, aplique somente indices ausentes:

```bash
docker compose -f compose.homolog.yml --profile tools run --rm index-manager
```

O mecanismo aborta em colisoes unique ou definicoes incompatíveis, nunca remove
indices e nao chama `syncIndexes`. Em seguida, crie o primeiro ADMIN:

```bash
docker compose -f compose.homolog.yml --profile tools run --rm bootstrap-admin
```

O bootstrap e manual, aceita somente `APP_ENV=homologation`, usa o mesmo
`bcrypt` com 12 rounds da aplicacao, associa o usuario a
`erp-souza-main-store` e recusa sobrescrever username existente. Nao existe
endpoint, senha padrao ou criacao automatica no startup.

## 3. HTTPS local confiavel

Adicione ao arquivo `hosts` do computador:

```text
127.0.0.1 erp-souza.local
```

Inicie aplicacao e proxy:

```bash
docker compose -f compose.homolog.yml up --build -d app proxy
```

O navegador acessa `https://erp-souza.local:8443`. Somente
`127.0.0.1:8443` e publicado; a porta 3000 existe apenas na rede interna do
Compose. O Next continua escutando em `0.0.0.0:3000` dentro do container.

O Caddy cria uma CA local em volume Docker, nunca no Git. Exporte o certificado:

```bash
docker compose -f compose.homolog.yml cp \
  proxy:/data/caddy/pki/authorities/local/root.crt ./caddy-homolog-root.crt
```

Importe `caddy-homolog-root.crt` como autoridade certificadora confiavel no
sistema operacional/navegador do computador de desenvolvimento. Feche e reabra
o navegador. Depois da importacao, remova a copia exportada; `*.crt` nao deve
ser versionado. Firefox pode usar seu proprio repositório de autoridades e
exigir importacao em Configuracoes > Privacidade e Seguranca > Certificados >
Autoridades.

Os cookies continuam `secure`, `httpOnly` e `sameSite=lax`. Nao ha excecao de
autenticacao para HTTP.

## 4. Validacao integrada e limpeza

Com a CA confiada tambem pelo Node (`NODE_EXTRA_CA_CERTS`), execute. A variavel
`HOMOLOGATION_CONNECT_ADDRESS` permite que o teste alcance o proxy local sem
depender da configuracao do arquivo `hosts`; o TLS continua validando o nome
`erp-souza.local` do certificado:

```bash
NODE_EXTRA_CA_CERTS="$PWD/caddy-homolog-root.crt" \
HOMOLOGATION_CONNECT_ADDRESS=127.0.0.1 \
node --env-file=.env.homolog.local --import tsx --test \
  tests/homologation.integration.test.ts
```

O teste usa nomes com UUID, cria um USER pela API autenticada, valida login,
sessao, roles, cadastros, venda, movimentacao, estoque, rollback, estoque
insuficiente, cancelamento repetido e estado persistido. A limpeza usa somente
os IDs criados nessa execucao; nao usa `dropDatabase`.

A verificacao final do cookie deve ser feita tambem no navegador, com o
certificado confiavel: login valido, recarga de pagina mantendo a sessao,
logout e redirecionamento/bloqueio ao tentar retornar ao dashboard. `curl` ou
`fetch` isoladamente nao comprovam o comportamento do navegador.

## Limites atuais do Atlas Flex

Flex usa MongoDB 8.0 ou posterior. A documentacao geral do MongoDB exige replica
set ou cluster sharded para transacoes; por isso o check de topologia e o teste
de commit/rollback acima sao obrigatorios antes de considerar esse recurso
validado no cluster efetivo. Limites
relevantes incluem 5 GB somando dados e indices, 500 conexoes, 500 operacoes por
segundo, ate 100 databases e 500 collections, agregacoes com no maximo 50
estagios e sem `allowDiskUse`, alem da ausencia de private endpoints, auditoria
de database, PITR e rolling index builds. Backups sao snapshots diarios, sem
snapshot sob demanda. Para producao com requisitos maiores de disponibilidade,
backup ou isolamento, reavaliar um cluster dedicado.

Referencias oficiais: [limitacoes do Atlas Flex](https://www.mongodb.com/docs/atlas/reference/flex-limitations/)
e [requisitos de transacoes](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/).

## Pendencias de producao

Nenhum procedimento deste documento acessa `erpSouza` ou `test`. Em etapa
posterior, apos confirmar qual database e producao e obter autorizacao explicita:

1. consultar somente o ADMIN esperado, sem usar sua credencial nos testes;
2. validar o hash com `bcrypt.compare`, sem imprimir ou copiar o hash;
3. conferir `role=ADMIN`, `isActive=true` e
   `storeId=erp-souza-main-store`;
4. executar auditoria read-only de indices e colisoes;
5. preparar snapshot restauravel e revisar o plano antes de qualquer apply;
6. nao executar migracao/backfill nesta etapa e nao usar `syncIndexes`.
