# Publicacao do ERP Souza em producao

Este guia publica a aplicacao da branch `chore/docker-homologacao` em uma VPS
Ubuntu 24.04 usando Docker Compose e Caddy. A aplicacao conecta ao MongoDB Atlas
no database `erpSouza`; nenhum container MongoDB e criado. Os passos abaixo nao
executam migracoes, bootstrap de usuario nem criacao automatica de indices.
Execute os comandos de obtencao da versao depois que esta configuracao revisada
estiver commitada e disponivel no remote da branch.

## Pre-requisitos antes de iniciar

- Crie um registro DNS `A` de `gerenciaconstrucoes.tech` apontando para
  `2.25.108.191` e aguarde a propagacao. Confira registros `A` e `AAAA` existentes;
  remova ou corrija entradas conflitantes. Use `AAAA` somente se a VPS estiver
  configurada e acessivel por IPv6.
- Confirme que as portas TCP 80 e 443 chegam a VPS. Preserve a porta e as regras
  de SSH usadas pelo usuario administrativo. Portas publicadas pelo Docker podem
  contornar regras do UFW; valide o firewall do host e as regras de rede do
  provedor, sem depender apenas do UFW.
- Autorize no Atlas somente o IP de saida real da VPS. Nao use uma regra para
  qualquer IP. Confira que o usuario MongoDB tem as permissoes necessarias em
  `erpSouza`.
- Antes de iniciar o ERP, confira o administrador existente de producao: hash de
  senha compativel com o mecanismo atual, `role`, `isActive` e `storeId`. Esta
  publicacao nao altera nem recria esse usuario.
- Revise o plano de indices do projeto e prepare os indices necessarios em
  `erpSouza` em uma operacao revisada e explicitamente autorizada. A aplicacao
  usa `autoIndex: false`, portanto nao dependa da criacao automatica. Nao execute
  `syncIndexes` indiscriminadamente.
- Conclua a validacao do login e da sessao em navegador real usando HTTPS antes
  de liberar o ERP aos usuarios.

O certificado publico e a redirecao HTTP para HTTPS sao gerenciados pelo Caddy.
Eles somente poderao ser validados depois que o DNS estiver apontando para a VPS
e as portas 80/443 estiverem acessiveis publicamente.

## Obter a versao na VPS

Execute estes comandos em uma sessao SSH do usuario `deploy`:

```sh
sudo install -d -o deploy -g deploy /opt/erp-souza
cd /opt/erp-souza
git clone --branch chore/docker-homologacao --single-branch \
  https://github.com/pedrodevsz/erp-souza.git .
```

Se o clone ja existir, atualize-o sem aceitar divergencias automaticamente:

```sh
cd /opt/erp-souza
git fetch origin
git switch chore/docker-homologacao
git pull --ff-only origin chore/docker-homologacao
```

Confira a revisao que sera publicada:

```sh
git status --short --branch
git log -1 --oneline
```

## Criar a configuracao local

Copie o exemplo, crie um `AUTH_SECRET` aleatorio diretamente no arquivo sem
imprimi-lo no terminal e edite a URI e as chaves opcionais:

```sh
cd /opt/erp-souza
umask 077
cp production.env.example .env.production.local
chmod 600 .env.production.local
sed -i '/^AUTH_SECRET=/d' .env.production.local
printf 'AUTH_SECRET=' >> .env.production.local
openssl rand -hex 48 >> .env.production.local
nano .env.production.local
chmod 600 .env.production.local
```

No editor, substitua os placeholders de `MONGODB_URI` por credenciais de
producao com o caminho `/erpSouza` explicito. O `AUTH_SECRET` ja foi gerado;
nao o substitua por um valor da homologacao. `OPENAI_API_KEY` e `OPENAI_MODEL`
sao opcionais e so precisam ser configurados para usar a importacao assistida.
O modelo tem fallback para `gpt-4.1-mini` no codigo.

O Compose interpreta valores nao citados e entre aspas duplas. Mantenha valores
com `$` entre aspas simples para passarem literalmente; se houver uma aspa
simples no valor, escape-a como `\'`. Para a URI MongoDB, percent-encode os
caracteres reservados do nome de usuario e senha conforme a sintaxe da URI. Nao
coloque espacos em volta de `=` nem acrescente comentarios no fim de valores.
O arquivo `.env.production.local` e ignorado pelo Git e excluido do contexto
Docker.

## Validar, construir e iniciar

`config --quiet` valida o Compose sem imprimir a configuracao interpolada, que
inclui variaveis sensiveis:

```sh
docker compose --env-file .env.production.local -f compose.production.yml config --quiet
```

Gere uma tag imutavel associada ao commit e construa somente o servico da
aplicacao. O build nao recebe credenciais nem precisa conectar ao Atlas:

```sh
export APP_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
docker compose --env-file .env.production.local -f compose.production.yml build app
docker compose --env-file .env.production.local -f compose.production.yml up -d
```

Consulte o estado e os logs recentes:

```sh
docker compose --env-file .env.production.local -f compose.production.yml ps
docker compose --env-file .env.production.local -f compose.production.yml logs --tail=100 app proxy
```

## Conferir HTTP e HTTPS

Depois de confirmar o DNS e a acessibilidade publica das portas, verifique o
redirecionamento HTTP:

```sh
curl --silent --show-error --output /dev/null --write-out 'HTTP %{http_code}; destino %{redirect_url}\n' \
  http://gerenciaconstrucoes.tech/login
```

O resultado esperado e um redirecionamento para `https://gerenciaconstrucoes.tech/login`.
Valide a cadeia TLS e a resposta da pagina de login sem desativar a verificacao
do certificado:

```sh
curl --fail --silent --show-error --output /dev/null \
  --write-out 'HTTPS %{http_code}; certificado verificado pelo sistema\n' \
  https://gerenciaconstrucoes.tech/login
```

Uma resposta da pagina `/login` confirma apenas que a rota HTTP esta acessivel.
Ela nao comprova login, sessao, acesso ao Atlas ou autorizacao. Valide login e
cookie no navegador real por HTTPS; cookies de sessao mantem `secure`,
`httpOnly` e `sameSite` em producao.

## Atualizacao controlada

Antes de atualizar, anote a tag da imagem atualmente executada. Ela corresponde
ao commit e sera usada para voltar a versao anterior se necessario:

```sh
docker inspect --format '{{.Config.Image}}' \
  "$(docker compose --env-file .env.production.local -f compose.production.yml ps -q app)"
```

Busque a revisao revisada, confirme a alteracao e construa uma nova imagem com
uma nova tag:

```sh
git fetch origin
git pull --ff-only origin chore/docker-homologacao
git log -1 --oneline
export APP_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
docker compose --env-file .env.production.local -f compose.production.yml config --quiet
docker compose --env-file .env.production.local -f compose.production.yml build app
docker compose --env-file .env.production.local -f compose.production.yml up -d
```

Confira `ps`, os logs e as URLs HTTPS acima antes de liberar a versao.

## Voltar a imagem anterior

Use a tag anotada antes da atualizacao. Isso recria somente a aplicacao com a
imagem anterior e nao altera o banco:

```sh
export APP_IMAGE_TAG='<tag-anterior-anotada>'
docker compose --env-file .env.production.local -f compose.production.yml up -d --no-build --no-deps app
docker compose --env-file .env.production.local -f compose.production.yml ps
docker compose --env-file .env.production.local -f compose.production.yml logs --tail=100 app
```

Mantenha as imagens antigas ate confirmar a atualizacao. A reversao de imagem
nao desfaz mudancas de esquema, documentos ou indices no Atlas; esta aplicacao
nao executa essas operacoes durante a inicializacao.

## Parar a aplicacao

Para parar os servicos e preservar os volumes de dados e configuracao do Caddy:

```sh
docker compose --env-file .env.production.local -f compose.production.yml stop
```

Os volumes `production_caddy_data` e `production_caddy_config` guardam estado
persistente do Caddy. Preserve-os ao remover ou substituir containers.
