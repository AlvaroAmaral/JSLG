# Sistema de Gestão JSLG

API e painel web para coordenadores dos Jovens de São Luis Gonzaga. O sistema mantém membros, agenda de eventos e registros de presença; membros não possuem conta de acesso.

## Executar com Docker

1. Copie `.env.example` para `.env` e configure `DB_PASSWORD`, `ADMIN_PASSWORD` e `JWT_SECRET`. Use uma senha de coordenador com pelo menos 12 caracteres e uma chave JWT com pelo menos 32 bytes.
2. Suba a aplicação e o PostgreSQL:

   ```bash
   docker compose up --build -d
   ```

3. Abra `http://localhost:8080`. A API interativa está em `http://localhost:8080/swagger-ui.html`.

O primeiro coordenador é criado no banco durante a inicialização usando `ADMIN_USERNAME` e `ADMIN_PASSWORD`. A senha é salva com BCrypt. Ao trocar o usuário ou a senha depois que a conta inicial já existir, ajuste a conta diretamente no banco ou use uma nova base de dados.

A conta definida por `ADMIN_USERNAME` é o coordenador master. Pela área **Coordenação**, ela pode cadastrar, editar nome de usuário, redefinir senha e excluir as contas comuns de coordenador. Ao redefinir uma senha ou excluir uma conta, as sessões ativas daquela conta deixam de funcionar. A conta master é protegida contra edição e exclusão por essa área. Os coordenadores comuns têm acesso aos membros, encontros e presenças, mas não podem administrar outras contas. O papel master também é aplicado à conta já existente configurada como `ADMIN_USERNAME` na próxima inicialização. Depois de atualizar, saia e entre novamente para receber o novo papel.

O Compose e a execução direta exigem `ADMIN_PASSWORD` e `JWT_SECRET` configurados no `.env` ou no ambiente. O `.env.example` contém campos vazios de propósito: preencha-os com valores próprios antes de iniciar. Use uma senha de pelo menos 12 caracteres e uma chave JWT aleatória com pelo menos 32 bytes. O nome de usuário padrão é `coordenador`.

## Executar em desenvolvimento

Requer Java 21, Maven, Node.js 20.19+ e PostgreSQL 16. Copie `.env.example` para `.env`, configure as credenciais e inicie o banco com `docker compose up -d db`. Compile o painel e inicie o Spring Boot:

```bash
cd frontend
npm ci
npm run build
cd ..
mvn -Dmaven.test.skip=true package
java -jar target/jslg-0.0.1-SNAPSHOT.jar
```

O build do React grava os arquivos em `src/main/resources/static`, que o Spring Boot publica junto com a API. Para desenvolver o front-end com atualização automática, use `npm run dev` dentro de `frontend`; o Vite encaminha `/api` para `localhost:8080`.

O Spring Boot lê `.env` na execução local, e o Docker Compose o carrega automaticamente. Para Docker Compose, a aplicação conecta ao serviço `db`; para execução direta, `DB_URL` usa `localhost:5432`.

## API

Todas as rotas abaixo, exceto login e documentação, exigem `Authorization: Bearer <token>`.

| Método | Rota | Ação |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Login do coordenador (`usuario`, `senha`) |
| `GET`, `POST` | `/api/coordenadores` | Listar e cadastrar coordenadores (somente master; senha mínima de 12 caracteres) |
| `PUT`, `DELETE` | `/api/coordenadores/{id}` | Editar usuário, opcionalmente redefinir senha, ou excluir uma conta comum (somente master; a conta master é protegida) |
| `GET`, `POST` | `/api/membros` | Listar e cadastrar membros (`nome`, `instagram` e `telefone`) |
| `GET`, `PUT`, `DELETE` | `/api/membros/{id}` | Consultar, editar e excluir membro |
| `GET`, `POST` | `/api/eventos` | Listar e agendar eventos (descrição e arte opcionais) |
| `GET`, `PUT` | `/api/eventos/{id}` | Consultar e editar evento |
| `DELETE` | `/api/eventos/{id}` | Excluir encontro realizado ou cancelado e suas presenças/arte |
| `GET` | `/api/eventos/{id}/arte` | Consultar a arte do encontro |
| `PATCH` | `/api/eventos/{id}/cancelamento` | Cancelar mantendo no histórico |
| `GET` | `/api/eventos/{id}/presencas` | Listar presenças do evento |
| `POST` | `/api/eventos/{id}/presencas` | Registrar presença (`membroId`) |
| `DELETE` | `/api/eventos/{eventoId}/presencas/{membroId}` | Remover presença |
| `GET` | `/api/membros/{id}/presencas` | Consultar histórico do membro |

O Flyway cria e atualiza o esquema. O cadastro exige o nome; Instagram e telefone são opcionais. O nome de usuário do Instagram pode ser informado com ou sem `@`. Encontros aceitam descrição e arte PNG, JPEG ou WebP de até 1 MB; depois do horário marcado, aparecem automaticamente em **Encontros realizados**. Presenças duplicadas são bloqueadas; eventos cancelados permanecem no histórico e não aceitam presença.

## Publicar com Neon, Render e Vercel

Este projeto pode usar Neon para PostgreSQL, Render para a API Spring Boot e Vercel para o frontend React. A Vercel deve usar `frontend` como diretório raiz do projeto, com o comando de build `npm run build` e o diretório de saída `dist`. Configure a variável de build:

```text
VITE_API_URL=https://SUA-API.onrender.com/api
```

No Neon, crie um banco PostgreSQL. No serviço Web do Render, conecte o repositório pela raiz e escolha Docker. Cadastre estas variáveis de ambiente no Render (não no repositório):

| Variável | Valor |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://HOST_NEON/NOME_BANCO?sslmode=require` |
| `DB_USER` | Usuário do Neon |
| `DB_PASSWORD` | Senha do Neon |
| `ADMIN_USERNAME` | Nome de usuário do coordenador master |
| `ADMIN_PASSWORD` | Senha forte, com pelo menos 12 caracteres |
| `JWT_SECRET` | Segredo aleatório com pelo menos 32 bytes |
| `CORS_ALLOWED_ORIGINS` | Domínio da Vercel, por exemplo `https://seu-projeto.vercel.app` |

Depois do primeiro deploy do backend, use a URL gerada pelo Render em `VITE_API_URL` na Vercel e faça o deploy do frontend. Se usar domínio próprio ou URLs de preview da Vercel, inclua cada origem necessária em `CORS_ALLOWED_ORIGINS`, separada por vírgulas, e faça novo deploy do Render. O primeiro início da API executa as migrations Flyway e cria o coordenador master configurado. O plano gratuito do Render pode suspender o serviço após inatividade, causando demora na primeira requisição.
