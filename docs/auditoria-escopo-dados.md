# Auditoria do escopo de dados

Complemento de `operacao-uma-loja-multiplos-funcionarios.md`, revisado contra
schemas Mongoose, services, indices e referencias implementadas. `userId` e
atualmente simultaneamente filtro de propriedade e, nos documentos criados,
identificador do funcionario que criou o registro. Nao ha um campo operacional
`storeId`, `createdBy` ou `updatedBy` hoje.

| Collection/model | Filtro de service atual | Indices atuais relevantes | Novo escopo proposto | Autor atual/proposto | Referencias observadas |
|---|---|---|---|---|---|
| `users` / User | Sem escopo de loja; login por `username`, lookup por `_id` | `_id`; `username` unico | Identidade global, sem `storeId` | Nenhum campo de autor | `userId` das demais collections aponta a `_id` |
| `customers` / Customer | `userId` em list/get/create/unicidade e migracao legada | `userId`; unico `{userId, document}` parcial para string | `storeId` | `userId` de criacao preservado como autor legado; adicionar `createdBy`/`updatedBy` explicitamente | Sale e ProductReservation usam `customerId`; Delivery guarda `customerId` |
| `products` / Product | `userId` em list/get/create/update/unicidade e compra/importacao | `userId`; unico `{userId, name, unit, brand}` | `storeId` | `userId` de criacao preservado; `createdBy`/`updatedBy` novos | Sale/Purchase guardam `items[].productId`; Inventory usa `productId` |
| `inventories` / Inventory | `userId` em busca, mutacao, estoque, movimentos e sincronizacao de compra/venda | `userId`; unicos `{userId, productName, unit, brand}`, `{userId, sku}`, `{userId, productId}` | `storeId` | `userId` de criacao; auditoria explicita de alteracao necessaria | `productId` relaciona Product; reservas e movimentos apontam estoque; categoria/fornecedor sao texto |
| `inventorymovements` / InventoryMovement | `userId` em listagem e delecao; `itemId` em historico | `userId`; `{userId, itemId, date}`; `{itemId, date}` | `storeId` | `userId` e o unico ID ligado a User; campo `user` e rotulo textual (ex. Vendas/Compras), nao autor confiavel | `itemId` -> Inventory `_id` |
| `inventorycategories` / InventoryCategory | `userId` em list/create/unicidade | `userId`; unico `{userId, name}` | `storeId` | `userId` de criacao; sem atualizacao/autoria explicita | Inventory.category e texto, sem FK |
| `suppliers` / Supplier | `userId` em list/get/create/unicidade; importacao de compra | `userId`; unico `{userId, name}` | `storeId` | `userId` de criacao; adicionar `updatedBy` para alteracoes futuras | Purchase.supplier e Inventory.supplier sao nomes textuais, nao IDs |
| `purchases` / Purchase | `userId` em list/get/update/delete e consultas de importacao | `userId`; `supplier` e `invoiceNumber` indexados simples; cada um duplicado entre `index:true` e `schema.index()` | `storeId` | `userId` de criacao, sem `createdBy`/`updatedBy` explicitos | `items[].productId` -> Product e sincronizacao Inventory; `supplier` e string |
| `sales` / Sale | `userId` em list/get/update/delete/pagamento/cancelamento e migrations legadas | `userId`; `saleDate`, `deliveryStatus`, `paymentMethod`; `customerName`, `sellerName` simples | `storeId` | `userId` de criacao; history.user e snapshot textual de sellerName, nao o ator autenticado; adicionar IDs de autor sem apagar historico | `customerId` -> Customer; `sellerId` e referencia logica a Employee; `items[].productId` -> Product/Inventory; Delivery.saleId |
| `deliveries` / Delivery | `userId` em list/get/alteracoes/sincronizacao | `userId`; unico `{userId, saleId}`; indices de saleId, customerId/name, data/status/driver | `storeId` | `userId` de criacao; atualizacoes sem autor explicito | `saleId` -> Sale; `customerId` -> Customer. Fluxo atual pode atribuir entregas legadas sem userId ao usuario que sincroniza |
| `productreservations` / ProductReservation | `userId` em validacao de estoque/cliente e criacao | `userId`; `{userId, productId, customerId, reservedAt}` | `storeId` | `userId` de criacao | `inventoryId` -> Inventory `_id`; `productId` -> Product/Inventory; `customerId` -> Customer |
| `employees` / Employee | `userId` em list/get/create/update/status | `userId`; `name`, `role`, `active` simples | `storeId` para funcionarios operacionais; User de autenticacao continua separado | `userId` de criacao, sem auditoria explicita de atualizacao | Sale.sellerId aponta logicamente ao `_id` do Employee |

**Nota sobre referencias:** Purchase.supplier, Inventory.supplier e
Inventory.category sao correspondencias por texto, nao FKs. A auditoria trata
Purchase.supplier como correspondencia textual normalizada somente para
localizar provaveis divergencias; esse resultado e indicativo e precisa de
validacao humana. Product IDs em vendas/compras/reservas podem apontar ao
Product ou ao identificador de produto replicado no Inventory; por isso a
auditoria considera ambos. Referencias cruzadas por `userId` hoje podem ser
dados legados validos ou inconsistencias; nao as reescrever automaticamente.

## Auditoria read-only

O script `scripts/audit-store-scope.ts` carrega o ambiente de desenvolvimento
com `@next/env` e usa `MONGODB_URI` por padrao, inclusive quando ela esta apenas
no `.env.local`. Ele exige database no path da URI e o mesmo valor em
`--database`. A conexao usa diretamente o driver `mongodb`, sem carregar models
Mongoose ou sincronizar indices. O codigo acessa somente `hello`, `find` e
`aggregate` nas collections de uma allowlist; nao contem operacoes de mutacao.
A saida contem hostname/database, contagens, IDs anonimizados, hashes de chaves
de colisao e amostras de referencias tecnicas, nunca usernames, telefones,
documentos completos, senhas, hashes de senha ou URI.

Depois de confirmar o database nao sensivel do destino, execute sem colocar a
URI no historico do shell:

```bash
pnpm exec tsx scripts/audit-store-scope.ts --database '<database-confirmado>'
```

`--uri-env` continua disponivel para uma variavel alternativa explicita. O
script limita suas operacoes a leitura independentemente das permissoes mais
amplas que a credencial configurada possa possuir.

## Resultado sintetico do auditor

Fixtures artificiais num container MongoDB 7.0 local e descartavel geraram, de
forma intencional: duplicidade de documento de cliente normalizado, produto,
estoque/SKU e categoria; referencias faltantes e referencias entre dois
`userId`; autor de usuario inexistente igual a zero. A saida mostrou apenas
ObjectIds e digest de 14 caracteres para as chaves duplicadas. Container,
usuario read-only e fixtures foram descartados ao encerrar o comando. Esses
valores nao descrevem o Atlas.

## Ambiente e testes de integracao

O comando `bash scripts/test-mongodb-integration.sh` cria um container sem
volume, inicializa replica set `rs0`, define internamente
`MONGODB_TEST_URI=.../erp_souza_integration_test` e o remove ao final. Nunca
le `MONGODB_URI`. O helper recusa host remoto, database diferente, replica set
ausente, URI de desenvolvimento igual e ausencia de URI explicita. Os testes
persistem somente fixtures sinteticas identificadas por run e verificam o
estado final diretamente nas collections antes da limpeza.

O teste caracteriza o estado **atual**, nao o objetivo futuro: cada funcionario
consulta somente documentos com seu proprio `userId`, nas collections Sale,
Product, Customer e Inventory. O teste deve ser alterado quando o servico usar
`storeId`: ambos os funcionarios devem ver o mesmo conjunto e os campos de
autor devem continuar distintos.
