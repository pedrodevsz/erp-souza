# Operacao: uma loja, varios funcionarios

## Estado da auditoria historica

Auditoria de codigo e configuracao local em 2026-09-28. Nenhum documento foi
lido ou alterado no Atlas. A URI local tem database explicito (`test`), mas o
nome do database nao prova que o cluster seja descartavel ou nao produtivo.
Nao foi feita conexao para conferir identidade, autorizacoes ou topologia do
cluster.

O escopo de dados atual e o usuario autenticado (`userId`) em clientes,
produtos, estoque e movimentacoes, categorias, fornecedores, compras, vendas,
entregas, reservas e funcionarios operacionais. Indices unicos tambem usam
`userId` em clientes/documento, produtos/nome+unidade+marca, estoque/SKU,
estoque/productId, estoque/nome+unidade+marca, categorias/nome,
fornecedores/nome e entregas/saleId. Consultas do dashboard chamam esses
servicos e, portanto, herdam o isolamento por usuario. Usuarios de login
continuam sendo identidade/autorizacao e nao devem ser fundidos.

`userId` e gravado como o usuario que cria a maior parte dos registros, mas os
servicos tambem o usam como proprietario/limite de leitura e escrita. Trocar
esse valor por um id de loja apagaria sua utilidade de auditoria e pode violar
referencias. Entregas sem `userId` ainda podem ser atribuidas durante a
sincronizacao de entregas; esse comportamento nao e uma migracao segura e deve
ser removido antes do compartilhamento.

## Escopo implementado e cutover

Usar um identificador estavel e constante para a unica loja, por exemplo
`erp-souza-main-store`, em um campo novo `storeId` nas colecoes operacionais.
Manter `userId` sem alteracao como autor historico/criador e adicionar campos
explicitos de auditoria (`createdBy`/`updatedBy`, ou equivalente) em novos
registros e alteracoes quando necessario. Movimentacoes e historico devem
guardar o identificador do funcionario, nao apenas um rotulo textual.

Todas as consultas, referencias e indices de unicidade operacionais passam a
usar `storeId`; as verificacoes de role continuam no servidor. A colecao de
usuarios de autenticacao permanece fora do escopo compartilhado. Antes de
implantar a leitura exclusiva por `storeId`, e obrigatorio preencher e validar
esse campo para todos os documentos elegiveis. Nao ativar codigo novo de
escopo compartilhado antes da migracao aprovada.

Colecoes que precisam entrar no inventario de migracao: Customer, Product,
Inventory, InventoryMovement, InventoryCategory, Supplier, Purchase, Sale,
Delivery, ProductReservation e Employee. As relacoes a conferir incluem
Sale.customerId, Sale.items.productId, Purchase.items.productId,
Delivery.saleId/customerId, ProductReservation.inventoryId/productId/customerId
e InventoryMovement.itemId. UserModel nao e dado da loja.

## Plano verificavel de migracao

1. **Congelar e identificar:** confirmar database/cluster por canal seguro,
   validar que a execucao e autorizada e congelar escritas durante o corte.
   Nunca inferir ambiente somente pelo nome `test`.
2. **Dry-run somente leitura:** para cada colecao, contar documentos sem
   `storeId`, com `storeId`, sem `userId`, agrupados por `userId` (incluindo
   nulos) e por role/estado do usuario quando aplicavel. Emitir totais e ids
   tecnicos, sem dados pessoais.
3. **Checar referencias:** contar referencias ausentes, entre autores diferentes
   e ambiguas nas relacoes listadas acima. Entregas sem autor precisam ser
   ligadas a uma venda de forma univoca; nunca atribuir ao funcionario que
   primeiro abriu a tela.
4. **Detectar conflitos antes de escrever:** agrupar pela chave comercial que
   se tornara unica por loja: documento normalizado de cliente; nome+unidade+
   marca e SKU/productId de produto/estoque; nome de categoria/fornecedor;
   saleId de entrega. Informar todos os grupos com mais de um documento,
   distintos `userId` e referencias dependentes. Nao mesclar nem escolher um
   vencedor automaticamente. Resolver manualmente e registrar a decisao.
5. **Backup e ensaio:** obter snapshot consistente/backup completo do database,
   confirmar restore em ambiente isolado e executar o dry-run/migracao numa
   copia restaurada. Guardar checksum e relatorios antes/depois.
6. **Preparar indices:** apos conflitos zerados, criar os indices novos por
   `storeId` em modo verificavel. Manter os indices antigos ate confirmar a
   migracao e compatibilidade; nao chamar `syncIndexes()` em producao sem
   revisao, pois ele pode remover indices.
7. **Aplicar em janela controlada:** somente apos aprovacao do relatorio e do
   backup, preencher `storeId = erp-souza-main-store`, preservar cada
   `userId`, registrar contagens modificadas e abortar se qualquer contagem
   divergir do dry-run. Usar atualizacao condicional (`storeId` ausente) para
   idempotencia e batches rastreaveis.
8. **Verificar e liberar:** repetir contagens, referencias, conflitos e
   consultas por dois usuarios; inspecionar diretamente no MongoDB os estados
   finais e testar autorizacao por role. So entao liberar o codigo que usa
   `storeId`.
9. **Rollback:** antes de novas escritas compartilhadas, restaurar o snapshot
   consistente e voltar a versao anterior. Se a reversao for por campos,
   remover somente `storeId` criado pela migracao e os indices novos; nunca
   reescrever/remover `userId`. Depois que houver novas escritas, congelar
   operacoes, exportar os documentos criados/alterados desde o corte e fazer
   reconciliacao antes de qualquer rollback. Nao executar rollback cego.

## Variaveis e isolamento

As variaveis documentadas em `.env.example` sao `MONGODB_URI`, `AUTH_SECRET`,
`OPENAI_API_KEY` (opcional, apenas importacao assistida) e `OPENAI_MODEL`
(opcional, possui fallback no codigo). `MONGODB_URI` e validada quando a
conexao e solicitada, nao no startup. O codigo atual nao exige nome explicito
de database, nao verifica que o database de testes e diferente da producao e
nao valida previamente a permissao de escrita/transacao do usuario Atlas.
Transacoes requerem topology MongoDB que as suporte (replica set ou cluster
sharded); isso ainda deve ser confirmado para cada ambiente.

Os testes de integracao usam `MONGODB_TEST_URI` obrigatorio e recusam operacao
destrutiva antes de validar em codigo que:

- a URI de teste e explicitamente fornecida e o database tem sufixo/prefixo de
  teste aprovado;
- a URI efetiva nao e igual a `MONGODB_URI` nem aponta para o host/database de
  producao;
- sem essas verificacoes a suite falha antes de conectar ou limpar colecoes;
- um nonce UUID e um marcador persistido, ambos criados pelo runner Docker
  descartavel, correspondem antes de qualquer `dropDatabase()`;
- testes verificam o estado persistido no proprio Mongo de teste.

Nao existe fallback de leitura para documentos sem `storeId`. O corte deve ser
ordenado como backup, restore/rehearsal, audit, decisoes aprovadas, apply em
janela de manutencao, post-audit e deploy do codigo scoped. Fazer deploy antes
do backfill torna dados legacy invisiveis; incluir legacy sem escopo enfraquece
o isolamento e e proibido.

`.env.example` contem somente placeholders. Nao copiar valores reais para
documentacao, logs, fixtures ou relatorios.

## Evidencia e pendencias desta execucao

- `pnpm install --frozen-lockfile`: passou com `CI=true`; lockfile resolvido sem
  downloads novos. A primeira tentativa sem TTY abortou antes de instalar.
- `pnpm test`: 51 passaram, 0 falharam. Sao testes unitarios; o script padrao
  nao executa `tests/delivery-sync.test.ts` e nao testa escopo multiusuario ou
  concorrencia no MongoDB.
- `pnpm exec tsc --noEmit`: passou.
- `pnpm lint`: falhou em 3 erros preexistentes de `no-explicit-any` em
  `src/lib/purchase-import-extraction.ts` e
  `src/server/services/reports/reports.service.ts`; houve 4 avisos.
- `pnpm build`: passou. Reportou indices duplicados em `Purchase` para
  `supplier` e `invoiceNumber`.
- MongoDB: ha imagem Docker local `mongo:7.0`, mas nao havia container em
  execucao. Nenhum teste de integracao/concorrencia foi executado. Nao foram
  verificados no Atlas conectividade, roles/permissoes ou suporte a transacoes.
- Autorizacao: paginas/servicos ADMIN usam verificacao de role no servidor;
  nenhum controle de IP/rede/m maquina autorizado foi encontrado. Role ADMIN
  nao satisfaz esse requisito de rede.
- Desempenho: nao ha medicao/profiling ou plano de consulta nesta auditoria;
  nao ha justificativa para adicionar indices ou paginacao neste momento.

## Decisao

**NAO PRONTO** para operar com varios funcionarios compartilhando dados. Os
servicos ainda escopam as colecoes por `userId`; nao ha `storeId`, plano de
auditoria executavel ou backfill validado, e conflitos/referencias do Atlas
nao foram contados. Tambem faltam testes reais de concorrencia/estado final,
validacao Atlas e controle de rede para ADMIN. Nenhum dado foi migrado ou
alterado nesta auditoria.
