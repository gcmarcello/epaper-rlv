# 🚀 Projeto EPaper

Este README descreve os passos necessários para configurar e implantar o projeto utilizando o Railway como plataforma de hospedagem.

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
   - ⚠️ Nota: É necessário iniciar manualmente o serviço **MinIO** devido a uma limitação nas GitHub Actions.

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
