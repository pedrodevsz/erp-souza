# Plano de indices MongoDB

Fonte de verdade executavel: `scripts/mongodb-index-plan.ts`.

O plano contem todos os indices declarados pelos schemas Mongoose atuais, com
nomes deterministas. Declaracoes semanticamente duplicadas no mesmo schema sao
representadas uma unica vez: `employees` repete `name`, `role` e `active`;
`suppliers` repete `name`; `purchases` repete `supplier` e `invoiceNumber`;
`deliveries` repete `customerName` e `saleNumber`; `customers` declara
`storeId` implicitamente e tambem como `customer_store_lookup`. A definicao
explicita nomeada foi preservada no ultimo caso. Essas redundancias merecem
limpeza futura, mas nao mudam o indice fisico planejado.

## Dry-run read-only

```bash
npm run audit:indexes -- --database test
```

O comando usa `MONGODB_URI` por padrao, exige que o database da URI seja igual
ao argumento e somente executa `listIndexes`, `find`, `aggregate` e
`countDocuments`. Outra URI deve ser indicada pelo nome da variavel:

```bash
npm run audit:indexes -- --uri-env MONGODB_REHEARSAL_URI --database erp_souza_integration_test
```

## Apply no rehearsal descartavel

O runner exige host local, database exata de integracao, replica set, nonce e
marker criado pelo runner protegido:

```bash
npm run audit:indexes -- --uri-env MONGODB_TEST_URI \
  --database erp_souza_integration_test --target rehearsal \
  --confirm APPLY_INDEX_PLAN_TO_DISPOSABLE_REHEARSAL --apply
```

## Apply futuro apos snapshot

Executar somente depois de confirmar snapshot restauravel, corrigir a Sale
historica e obter zero blockers nos auditores. O identificador da evidencia do
snapshot deve ficar fora do repositorio:

```bash
npm run audit:indexes -- --database test --target production \
  --snapshot-evidence '<identificador-nao-secreto-do-snapshot>' \
  --confirm APPLY_INDEX_PLAN_AFTER_RESTORABLE_SNAPSHOT --apply
```

Antes do primeiro `createIndex`, o runner aborta se encontrar colisao unique
exata ou apos normalizacao, ou um indice com o mesmo nome e definicao
incompativel. Ele nunca remove indices, nao chama `syncIndexes`, nao habilita
`autoIndex` e nao modifica documentos.
