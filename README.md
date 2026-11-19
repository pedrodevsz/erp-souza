# ERP Souza (Sis-SZ)

ERP web para a operação de uma loja de materiais de construção. O Sis-SZ reúne compras, estoque, vendas e entregas em uma única aplicação, com contas individuais para os funcionários e dados operacionais compartilhados pela equipe da loja.

## Funcionalidades

| Módulo | O que o sistema permite fazer |
| --- | --- |
| Painel | Consultar indicadores da operação em um painel consolidado. |
| Vendas | Registrar vendas e pagamentos, consultar o histórico e cancelar vendas. |
| Compras | Registrar compras manualmente ou iniciar um rascunho a partir de uma nota fiscal. |
| Produtos e estoque | Gerenciar produtos, categorias, movimentações, reservas e limites mínimos de estoque. |
| Clientes | Cadastrar clientes e consultar ou atualizar seus dados. |
| Entregas | Acompanhar entregas vinculadas às vendas, marcar itens como entregues e concluir ou cancelar uma entrega. |
| Administração | Gerenciar contas de acesso com os perfis `ADMIN` e `USER`. |

## Decisões técnicas

- **Consistência entre registros e estoque.** Operações de compra e venda usam transações no MongoDB para agrupar alterações relacionadas e permitir rollback quando uma etapa falha.
- **Dados compartilhados por loja.** O servidor aplica o escopo de leitura e escrita por `storeId` e verifica as permissões com base na conta autenticada. As sessões usam cookies HTTP-only.
- **Importação de notas com revisão humana.** A integração com a OpenAI extrai dados da nota, sugere correspondências com produtos cadastrados e gera um rascunho que o usuário pode conferir antes de salvar a compra.

## Stack e estrutura

| Camada | Tecnologias |
| --- | --- |
| Aplicação web | Next.js 16 (App Router), React 19 e TypeScript |
| Interface e formulários | Tailwind CSS 4, shadcn/ui e React Hook Form |
| API e validação | Route Handlers do Next.js e Zod |
| Persistência | MongoDB e Mongoose |
| Integração e ambiente | OpenAI Responses API, Docker e Caddy para homologação local |

As páginas ficam em [`src/app`](src/app), os endpoints em [`src/app/api`](src/app/api) e a lógica de negócio, a autenticação e os modelos em [`src/server`](src/server).

## Como executar localmente

Use Node.js 22 e pnpm 10, conforme o Dockerfile. Para testar os fluxos de compra e venda, use um banco de desenvolvimento em um MongoDB com suporte a transações, como um replica set.

```bash
git clone https://github.com/pedrodevsz/erp-souza.git
cd erp-souza
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Configure as variáveis em `.env.local` usando o [arquivo de exemplo](.env.example).

| Variável | Finalidade |
| --- | --- |
| `MONGODB_URI` | Conexão com o MongoDB. Inclua o nome do banco de desenvolvimento na URI. |
| `AUTH_SECRET` | Segredo de sessão com pelo menos 32 caracteres aleatórios. |
| `OPENAI_API_KEY` | Chave da OpenAI, necessária para usar a importação assistida de notas fiscais. |
| `OPENAI_MODEL` | Modelo da OpenAI usado na importação. Remova o valor de exemplo para usar o padrão do código ou configure um modelo compatível. |

Inicie o servidor com `pnpm dev` e abra [http://127.0.0.1:3001](http://127.0.0.1:3001). Para entrar, use uma conta ativa cadastrada no banco configurado. Se estiver partindo de um banco vazio, o [guia de homologação](docs/homologacao-local.md) descreve como provisionar a primeira conta administrativa e executar a aplicação com Docker e HTTPS local.

## Verificações

| Comando | O que verifica |
| --- | --- |
| `pnpm test` | Testes automatizados de regras de negócio, autenticação, validação e utilitários. |
| `pnpm test:store-integration` | Testes de integração do escopo por loja em um MongoDB descartável via Docker. |
| `pnpm lint` | Verificações estáticas com ESLint. |
| `pnpm build` | Build de produção do Next.js. |

A suíte de integração requer Docker e a imagem `mongo:7.0` disponível localmente.

## Autor

Desenvolvido por [Pedro](https://github.com/pedrodevsz).
