# 🚀 Projeto EPaper

Este README descreve os passos necessários para configurar e implantar o projeto utilizando o Railway como plataforma de hospedagem.

##### Pagina OpenAPI - Prod

https://epaper-rlv-prod-production.up.railway.app/api-docs

###### Pagina OpenAPI - Staging

https://epaper-rlv-staging.up.railway.app/api-docs

# Experiência no Desenvolvimento do Projeto EPaper

Durante o desenvolvimento do projeto **EPaper**, enfrentei alguns desafios que me levaram a repensar as ferramentas e soluções inicialmente escolhidas. Gostaria de compartilhar um pouco da minha experiência e as decisões que tomei ao longo do caminho.

## Explorando a Stack

A stack do projeto é composta principalmente por **NestJS** no backend, **Drizzle ORM** para gerenciamento de banco de dados, **PostgreSQL** como banco de dados relacional e **MinIO** para uploads e armazenamento de arquivos.

Já tinha experiência prévia com o **NestJS**, o que me deixou confortável para criar a arquitetura do projeto e implementar funcionalidades de forma estruturada e modular. No entanto, esta foi minha primeira experiência utilizando o **Drizzle ORM**.

O Drizzle talvez tenha sido o mais complicado no quesito implementação. Por ser minha primeira experiência com ele, enfrentei algumas dificuldades, principalmente porque a documentação nem sempre é tão clara quanto eu esperava. Além disso, o fato de haver várias formas diferentes de fazer a mesma coisa me deixou um pouco confuso em alguns momentos. Apesar disso, achei a ferramenta interessante.

## Desafios com o Fly.io

Inicialmente, escolhi o **Fly.io** como plataforma de hospedagem, atraído pela flexibilidade e pela promessa de facilidade na exposição de containers para acesso público. Contudo, encontrei dificuldades na configuração dos serviços. Em especial, o processo de expor containers publicamente exigiu ajustes complexos e não muito intuitivos, o que acabou impactando a produtividade e dificultando a integração.

Após investir tempo tentando superar essas limitações, decidi buscar uma alternativa mais simples e com maior suporte nativo para o meu caso de uso. Foi então que optei por migrar para o **Railway**.

## Mudança para o Railway

O **Railway** provou ser uma escolha mais alinhada com as necessidades do projeto. Ele ofereceu uma interface mais amigável e recursos que facilitaram a configuração de serviços como o **PostgreSQL** e o **MinIO**. Além disso, sua integração com o GitHub permitiu um fluxo de trabalho contínuo para deploys automatizados nos ambientes de staging e produção.

A simplicidade no gerenciamento dos ambientes e a possibilidade de criar serviços interdependentes com poucos ajustes foram os principais diferenciais que me convenceram a continuar com o Railway.

## Limitações do GitHub Actions

Outro desafio enfrentado foi relacionado ao **GitHub Actions**. Embora extremamente útil para a automação do pipeline CI/CD, ele possui uma limitação importante: não é possível executar comandos diretamente dentro de containers configurados como `services`. Isso impactou diretamente o uso do **MinIO**, pois não consegui configurá-lo automaticamente como parte do ambiente de testes.

A solução foi iniciar manualmente um container do MinIO como parte do processo de testes. Apesar de não ser o ideal, essa abordagem funcionou bem e permitiu que o pipeline continuasse operando com os recursos necessários.

# CI/CD Pipeline

O pipeline foi projetado para gerenciar o processo de **testes** e **deploy** do projeto automaticamente, com foco no ambiente de staging. Ele é ativado toda vez que há um pull request ou um push na branch `staging`, ou um push na branch `main`.

## Como funciona?

### Etapa 1: Testes

Na primeira etapa, o pipeline configura um ambiente de teste completo. Ele utiliza serviços Docker, como um banco de dados PostgreSQL, e inicia um container MinIO para simular o ambiente de produção.

O código da aplicação é baixado do repositório, as dependências são instaladas, e os testes automatizados são executados. Isso garante que o código esteja funcionando corretamente antes de ser implantado.

### Etapa 2: Deploy para o Railway

Depois que os testes são aprovados, o pipeline faz o deploy automático para o ambiente de staging no Railway. Usando a CLI do Railway, ele carrega o código atualizado e configura o serviço do NestJS no ambiente de staging, conectando-o aos recursos, como o banco de dados e o MinIO.

## Pré-requisitos

1. **Conta no Railway**

   - Acesse [Railway](https://railway.app) e crie uma conta caso ainda não tenha.

2. **Ambientes no Railway**

   - Crie dois ambientes: **Produção (Prod)** e **Staging** no Railway.

3. **Tokens de Ambiente**

   - Gere tokens de ambiente no Railway para cada ambiente:
     - **RAILWAY_TOKEN_PROD**: Token do ambiente de Produção.
     - **RAILWAY_TOKEN_STAGING**: Token do ambiente de Staging.

4. **Conexão com Repositório e Branch**
   - No Railway, conecte seu repositório do GitHub ao projeto e vincule as branches aos respectivos ambientes:
     - **main** -> Produção
     - **staging** -> Staging

## Configuração de Serviços no Railway

1. **Criar Serviços**

   - Adicione os serviços necessários em cada ambiente:
     - **MinIO** (para upload de arquivos).
     - **PostgreSQL** (para banco de dados).

2. **Expor Domínios**

   - No Railway, exponha os domínios dos projetos para acesso público.

3. **Atualizar Comandos de Build**
   - Configure os comandos de build para ambos os ambientes no Railway:
     ```bash
     npm run build:migrate
     ```
     Desta forma, as migrations necessárias serão rodadas corretamente ao iniciar o build do NestJS.

## Configuração no GitHub Actions

1. **Adicionar Variáveis de Ambiente**

   - No repositório do GitHub, adicione as seguintes variáveis de ambiente nas GitHub Actions:
     ```text
     RAILWAY_MINIO_SERVICE_ID_PROD       - ID do serviço MinIO em Produção
     RAILWAY_MINIO_SERVICE_ID_STAGING    - ID do serviço MinIO em Staging
     RAILWAY_SERVICE_ID_PROD             - ID do serviço NestJS em Produção
     RAILWAY_SERVICE_ID_STAGING          - ID do serviço NestJS em Staging
     ```

2. **Adicionar Segredos de Ambiente**
   - No repositório do GitHub, adicione os seguintes segredos de ambiente:
     ```text
     DATABASE_URL_PROD   - URL do banco de dados de Produção
     DATABASE_URL_STAGING - URL do banco de dados de Staging
     RAILWAY_TOKEN_PROD   - Token do ambiente de Produção
     RAILWAY_TOKEN_STAGING - Token do ambiente de Staging
     ```

## Configuração de Variáveis no Railway

Adicione as seguintes variáveis de ambiente nos ambientes **Prod** e **Staging** no Railway:

```text
DATABASE_URL          - URL do banco de dados
JWT_EXPIRATION        - Tempo de expiração dos tokens JWT
JWT_SECRET            - Chave secreta para assinatura JWT
MINIO_BUCKET_NAME     - Nome do bucket MinIO
MINIO_PUBLIC_ENDPOINT - Endpoint público do MinIO
MINIO_ROOT_PASSWORD   - Senha root do MinIO
MINIO_ROOT_USER       - Usuário root do MinIO
```
