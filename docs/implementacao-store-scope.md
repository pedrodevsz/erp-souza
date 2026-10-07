# Implementacao do escopo compartilhado

## Contrato do contexto da loja

O ERP continua sendo uma aplicacao de uma unica loja. O identificador canonico
e `erp-souza-main-store`, definido somente em codigo de servidor. Cada User tem
uma associacao opcional `storeId` durante a transicao.

`requireStoreContext()` valida novamente no banco que o usuario da sessao:

- existe e esta ativo;
- possui uma associacao explicita e nao vazia com uma loja;
- conserva a role `ADMIN` ou `USER` carregada do banco.

Novos usuarios continuam associados somente a loja canonica. A resolucao aceita
outro `storeId` ja persistido para que os services mantenham isolamento e possam
ser exercitados com Store A/Store B; nao existe seletor ou troca de loja na UI.
O resultado interno e `{ storeId, actorId, role }`. Nenhum endpoint aceita
`storeId` do body, query string ou header como autorizacao. Usuario sem
associacao recebe 403 antes de qualquer consulta operacional. Assim, documentos
legados sem `storeId` nunca entram como fallback e o Atlas atual permanece fora
da ativacao ate o backfill ser aprovado.

`storeId` define propriedade e visibilidade. `userId` e preservado como autor
legado. Novos documentos gravam `createdBy` e `updatedBy`; movimentacoes gravam
`actorId`; novos eventos de historico de venda tambem gravam `actorId`.

## Concorrencia e historico

- Venda possui estado `ACTIVE`/`CANCELLED`. Cancelar novamente nao devolve
  estoque nem adiciona outro evento.
- Venda cancelada nao pode ser editada ou receber pagamento.
- O estoque e a venda sao alterados na mesma transacao. Falha de estoque
  reverte a criacao/edicao da venda.
- Mongoose usa versao e concorrencia otimista para Sale. PATCH exige
  `expectedRevision`; uma edicao concorrente obsoleta recebe 409.
- Itens historicos continuam snapshots. Se uma operacao exigir estoque e nao
  houver correspondencia por productId ou nome/unidade/marca, ela falha sem
  criar Product, Inventory ou InventoryMovement.
- Entrega ainda nao iniciada recebe o novo snapshot de itens da venda. Depois
  que qualquer item foi entregue, mudanca nos itens da venda recebe 409.
- Cancelar venda cancela a Delivery correspondente na mesma transacao. Excluir
  venda com Delivery e bloqueado (RESTRICT), inclusive depois do cancelamento,
  para preservar o historico e impedir documento orfao.
- Alteracoes de cliente, endereco, observacao e data entre venda e entrega tem
  autoridade comercial ainda indefinida. Os documentos existentes sao
  preservados; nenhuma sincronizacao destrutiva foi adicionada.

## Linha de base e pendencias legadas

A auditoria read-only encontrou 67 documentos operacionais, nao 66:

- autor legado ausente: 29 documentos, incluindo 4 Employee;
- autor ainda existente: 38 documentos;
- nenhum documento tinha `storeId`;
- um nome normalizado de Supplier colide entre os dois autores;
- seis itens em cinco vendas apontam para quatro IDs sem Product/Inventory pelo
  ID; quatro ocorrencias tem fallback unico de estoque e duas nao tem fallback.

O backfill nao deve preencher `createdBy` em registros antigos: isso inventaria
autoria. O `userId` original permanece. Fornecedores nao sao consolidados e
produtos nao sao remapeados pelo script.

## Ensaio da migracao

1. Restaurar backup consistente em replica set isolado.
2. Copiar `docs/store-migration-decisions.example.json` para fora do repositorio
   e substituir placeholders pelos IDs revisados. Nunca versionar IDs reais.
3. Executar somente o dry-run:

   ```bash
   MONGODB_REHEARSAL_URI='<uri-da-copia-com-database-explicito>' \
   pnpm migrate:store-scope -- --uri-env MONGODB_REHEARSAL_URI --database '<database>'
   ```

4. Conferir as contagens por collection, os dois owners, a colisao de Supplier
   e as seis referencias historicas.
5. Na copia descartavel, executar o preenchimento de dados explicitamente:

   ```bash
   MONGODB_REHEARSAL_URI='<uri-da-copia-com-database-explicito>' \
   pnpm migrate:store-scope -- --uri-env MONGODB_REHEARSAL_URI --database '<database>' \
     --decisions '<arquivo-fora-do-repositorio.json>' --target rehearsal \
     --confirm APPLY_STORE_SCOPE_TO_DISPOSABLE_REHEARSAL --apply-data
   ```

6. O modo de aplicacao aborta antes da transacao se houver qualquer blocker,
   `storeId` divergente, usuario ausente/inativo/com papel invalido, destino ou
   confirmacao divergentes. Durante a transacao, aborta se `matchedCount` ou
   contagens divergirem ou restar documento sem `storeId`. Ele nao altera indices.
7. Repetir auditoria e testes HTTP contra a copia. Resolver manualmente a
   identidade dos Suppliers antes de preparar indices unicos por loja.
8. Criacao/troca de indices e corte do Atlas exigem uma etapa separada, backup
   restauravel, janela de escrita congelada e nova autorizacao.

## Cutover no destino real

O codigo scoped nao possui fallback para documentos sem `storeId`, pois esse
fallback misturaria dados. A sequencia obrigatoria e: backup restauravel,
restore e rehearsal descartavel, auditoria e decisoes humanas aprovadas,
migration durante janela de manutencao, auditoria pos-migration e somente entao
deploy do codigo scoped. O apply de producao exige no arquivo de decisoes
`backupConfirmed: true`, `rehearsalConfirmed: true`, nota rastreavel, database
exato e tambem os argumentos:

```bash
--target production \
--confirm APPLY_STORE_SCOPE_TO_PRODUCTION_AFTER_BACKUP_AND_REHEARSAL
```

`NODE_ENV` nunca autoriza a migration. Store divergente nunca e sobrescrita.

## Reserva de produto

ProductReservation e uma funcionalidade ativa e isolada por Store. A reserva e
consumida em ordem cronologica, dentro da transacao, quando o mesmo cliente
compra o mesmo produto; o restante parcial e preservado. O cancelamento por ID
tambem exige a Store autorizada e libera `reservedStock` na mesma transacao.
Nao foi criado painel, tenant switching ou subsistema adicional.

## Estado de liberacao

O codigo pode ser validado em MongoDB descartavel sem que o Atlas esteja
migrado. A aplicacao so pode ser liberada com o novo escopo depois de backfill,
conflitos, indices e verificacao pos-migracao no destino real. Ate la, usuarios
sem `storeId` ficam bloqueados por design.
