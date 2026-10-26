# AGENTS.md — DevLinks API

> Manual Operacional para Agentes de IA · v1.0 · atualizado em Out/2026

Este documento é a **fonte única de verdade** para agentes que trabalham no repositório **DevLinks API**.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Comandos e Scripts](#4-comandos-e-scripts)
5. [Variáveis de Ambiente](#5-variáveis-de-ambiente)
6. [Autenticação JWT e Autorização (Ownership)](#6-autenticação-jwt-e-autorização-ownership)
7. [Banco de Dados e Modelos (Mongoose)](#7-banco-de-dados-e-modelos-mongoose)
8. [Validação e Tratamento de Erros](#8-validação-e-tratamento-de-erros)
9. [Endpoints e Rotas](#9-endpoints-e-rotas)
10. [Testes e Validação](#10-testes-e-validação)
11. [Git Flow e Conventional Commits](#11-git-flow-e-conventional-commits)
12. [Pull Request](#12-pull-request)
13. [Checklists](#13-checklists)
14. [Exemplos Completos](#14-exemplos-completos)

---

## 1. Visão Geral

A **DevLinks API** é o back-end RESTful do ecossistema DevLinks (consumido pelo front-end `devlinks-web`), responsável pelo cadastro e autenticação de usuários com JWT e bcrypt, gerenciamento de perfis e links personalizados, perfil público (`/p/:id`) e upload de avatares no Cloudinary.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão / Detalhes |
|--------|-----------|-------------------|
| **Runtime** | Node.js (ESM `"type": "module"`) | >= 20 |
| **Framework** | Express | 5.2.x |
| **Banco de Dados** | MongoDB + Mongoose | Mongoose 9.3.x |
| **Autenticação** | JSON Web Token (`jsonwebtoken`) + `bcrypt` | JWT + salt hash no hook `pre('save')` |
| **Validação** | Zod | 4.6.x (schemas em `src/validations/userValidation.js`) |
| **Upload de Imagens** | Multer + Cloudinary (`multer-storage-cloudinary`) | JPG, JPEG, PNG, WebP |
| **Segurança** | `express-rate-limit` + `cors` | Rate limit em `/login` e `/usuario` |
| **Testes** | Vitest + Supertest + `mongodb-memory-server` | 15 testes de integração em memória |
| **CI** | GitHub Actions (`.github/workflows/ci.yml`) | Executa `npm ci` e `npm test` |

---

## 3. Estrutura do Projeto

```
devlinks-api/
├── index.js                       # Ponto de entrada do servidor HTTP e conexão MongoDB
├── src/
│   ├── app.js                     # Configuração do Express, CORS, JSON, rotas e error handler
│   ├── db.js                      # Conexão com o MongoDB via Mongoose
│   ├── routes.js                  # Mapeamento de rotas públicas/protegidas e rate limiters
│   ├── config/
│   │   └── upload.js              # Configuração do Multer + Cloudinary
│   ├── controllers/
│   │   └── userController.js      # Controladores de usuários, autenticação, avatar e links
│   ├── middlewares/
│   │   ├── auth.js                # Middleware verificarToken (Bearer JWT)
│   │   └── validate.js            # Middleware validarCorpo (Zod)
│   ├── models/
│   │   └── User.js                # Schema Mongoose do usuário e hook pre('save') com bcrypt
│   └── validations/
│       └── userValidation.js      # Schemas Zod (cadastroSchema, loginSchema, edicaoSchema, linkSchema)
├── tests/
│   └── user.test.js               # Suíte de 15 testes de integração (Vitest + Supertest)
├── .env.example                   # Modelo de variáveis de ambiente
└── package.json                   # Scripts e dependências
```

---

## 4. Comandos e Scripts

```bash
# Desenvolvimento local (com watch e leitura de .env nativa do Node)
npm run dev              # node --env-file=.env --watch index.js

# Produção
npm start                # node index.js

# Testes Automatizados
npm test                 # vitest run (15 testes de integração com mongodb-memory-server)
npm run test:watch       # vitest (modo watch interativo)
```

---

## 5. Variáveis de Ambiente

```env
MONGO_URL=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/<banco>
JWT_SECRET=sua_chave_secreta_jwt
JWT_EXPIRES=1h
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
PORT=3000
```

- Nunca exponha `.env` ou segredos no repositório. Qualquer nova variável obrigatória deve ser documentada em `.env.example` e `README.md`.

---

## 6. Autenticação JWT e Autorização (Ownership)

- **Hash de senha**: gerado via hook `pre('save')` no modelo `User` com `bcrypt`. O campo `password` nunca deve ser retornado nas respostas da API.
- **Middleware `verificarToken`** (`src/middlewares/auth.js`): lê `Authorization: Bearer <token>`, valida o JWT com `JWT_SECRET` e injeta `req.usuarioId`.
- **Autorização de Ownership**: nas rotas `PUT /usuario/:id` e `DELETE /usuario/:id`, o `id` do parâmetro é comparado com `req.usuarioId` normalizado como `String`. Tentativas de alterar/excluir outro usuário retornam `403 Forbidden`.
- **Payload restrito no update**: `PUT /usuario/:id` aceita apenas `name`, `email`, `password` e `profession` (bloqueia injeção de `avatar` ou `links`).

---

## 7. Banco de Dados e Modelos (Mongoose)

- **`User`** (`src/models/User.js`):
  - `name` (String, obrigatório)
  - `email` (String, obrigatório, único)
  - `password` (String, obrigatório, hash bcrypt)
  - `profession` (String)
  - `avatar` (String, URL do Cloudinary)
  - `links` (Array de subdocumentos `{ titulo, url }`)

---

## 8. Validação e Tratamento de Erros

- **Zod** (`src/validations/userValidation.js` + `src/middlewares/validate.js`):
  - `cadastroSchema`, `loginSchema`, `edicaoSchema`, `linkSchema`.
  - Payloads inválidos retornam `400 Bad Request` com os detalhes de validação.
- **ObjectId inválido**: erros `CastError` do Mongoose são capturados pelo middleware global em `src/app.js` e retornam `400 Bad Request` (`{ message: 'Identificador inválido.' }`).
- **Rate Limiting** (`src/routes.js`):
  - `/login`: máx 5 tentativas a cada 15 minutos.
  - `/usuario`: máx 3 cadastros a cada 1 hora.
  - Desativado automaticamente quando `NODE_ENV === 'test'`.

---

## 9. Endpoints e Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/` | Público | Health check da API |
| `POST` | `/usuario` | Público | Cadastro de usuário (rate limit + Zod) |
| `POST` | `/login` | Público | Login e emissão de JWT (rate limit + Zod) |
| `GET` | `/p/:id` | Público | Perfil público (nome, avatar, profissão e links) |
| `GET` | `/meu-perfil` | JWT | Retorna dados do usuário autenticado (sem `password`) |
| `PUT` | `/usuario/:id` | JWT + Owner | Atualiza `name`, `email`, `password`, `profession` |
| `DELETE` | `/usuario/:id` | JWT + Owner | Remove a conta do próprio usuário |
| `PATCH` | `/usuario/foto` | JWT | Upload multipart (`foto`) de avatar no Cloudinary |
| `POST` | `/usuario/link` | JWT | Adiciona link (`titulo`, `url`) ao perfil autenticado |
| `DELETE` | `/usuario/link/:idLink` | JWT | Remove link pelo `_id` do subdocumento |

---

## 10. Testes e Validação

- Suíte em `tests/user.test.js` com **15 testes de integração** (Vitest + Supertest + `mongodb-memory-server`).
- Antes de qualquer commit, push ou abertura de PR, execute obrigatoriamente:

```bash
npm test   # Todos os testes de integração passando (exit code 0)
```

---

## 11. Git Flow e Conventional Commits

- Branches temáticas: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `test/`.
- Commits atômicos seguindo Conventional Commits: `tipo(escopo): descrição concisa`.
- Nunca commitar diretamente na `main` nem executar `git push --force`.
- CI (`.github/workflows/ci.yml`) executa `npm ci` e `npm test` em todo push/PR para `main`.

---

## 12. Pull Request

### 12.1 Título

```
tipo(escopo): descrição concisa no presente do indicativo (≤ 72 caracteres)
```

Exemplo: `feat(links): adiciona ordenacao nos links do perfil publico`

### 12.2 Regras de Redação e Densidade Técnica (Gold Standard)

Para garantir máxima clareza para revisores humanos e indexadores de código:
- **Sem emojis nos cabeçalhos ou listas:** Use Markdown puro (`### Features`, `### Fixes`, `### Docs`, `- [x] Feature`). É proibido usar emojis como `✨`, `🐛`, `📝` no corpo ou título do PR.
- **Resumo de alta densidade (1 a 3 frases):** Descreva o que foi entregue citando nominalmente os módulos, controllers, middlewares, rotas ou métricas impactadas (ex: `POST /usuario/link`, `GET /p/:id`, `userController.js`, `userValidation.js`). Evite frases genéricas.
- **Verbos de ação na 3ª pessoa do singular:** Inicie os itens do Changelog com verbos no presente do indicativo: *Adiciona*, *Atualiza*, *Corrige*, *Remove*, *Sincroniza*, *Concentra*, *Extrai*, *Valida*.
- **Como Testar reprodutível:** Comece sempre com o comando de execução (`1. Rode npm run dev.` ou `1. Rode npm test.`) e indique os endpoints exatos (ex: `POST /login`, `GET /meu-perfil`, `PUT /usuario/:id`) ou cenários de teste para validar a entrega.
- **Tipo de Mudança vertical e limpo:** Liste uma opção por linha, sem emojis, marcando com `[x]` apenas os tipos aplicáveis ao PR.
- **Validação real antes de marcar o Checklist:** O agente DEVE executar cada comando do checklist no terminal e confirmar saída limpa (exit code 0) antes de marcar `[x]`.

### 12.3 Changelog

Agrupe apenas pelas categorias presentes no PR, em texto limpo:

```markdown
### Features

- Adiciona validação de formato de URL em linkSchema
- Atualiza resposta de GET /p/:id com campos públicos sanitizados

### Tests

- Adiciona teste de integração para rejeição de URL inválida em POST /usuario/link
```

### 12.4 Template Oficial

```markdown
## Resumo

<!-- 1 a 3 frases diretas explicando o que mudou, quais rotas/controllers foram afetados e o impacto. -->

## Tipo de Mudança

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Test
- [ ] Chore

## Changelog

### Features

- <!-- Verbo no presente + entrega objetiva -->

## Como Testar

1. Rode `npm test` para validar a suíte de integração em memória.
2. Rode `npm run dev` e envie uma requisição para `<!-- endpoint (ex: GET /p/:id ou POST /usuario/link) -->` conferindo `<!-- comportamento esperado -->`.

## Checklist

- [ ] Testes de integração passam (`npm test`)
- [ ] Servidor inicia sem erros (`npm start`)
- [ ] Apenas arquivos do escopo alterados
```

### 12.5 Exemplo Real de Referência (Gold Standard)

Título: `chore(ci): adiciona workflow CI, script start e valida hash bcrypt`

```markdown
## Resumo

Adiciona pipeline de integração contínua em `.github/workflows/ci.yml` para rodar a suíte Vitest/Supertest em cada push e PR na `main`, define o script `npm start` em `package.json` e reforça `tests/user.test.js` validando o hash `bcrypt` salvo no banco.

## Tipo de Mudança

- [x] Test
- [x] Chore

## Changelog

### Tests

- Valida geração de hash bcrypt no cadastro e na edição de senha em `tests/user.test.js`

### Chores

- Adiciona workflow `.github/workflows/ci.yml` com execução automatizada de `npm test`
- Adiciona script `start` (`node index.js`) em `package.json`

## Como Testar

1. Rode `npm test` e confirme a aprovação dos 15 testes de integração.
2. Rode `npm run dev` e envie `POST /usuario` seguido de `POST /login` para validar a autenticação JWT.

## Checklist

- [x] Testes de integração passam (`npm test`)
- [x] Servidor inicia sem erros (`npm start`)
- [x] Apenas arquivos do escopo alterados
```

---

## 13. Checklists

### 13.1 Antes do Commit

- [ ] Mudança atômica (uma única responsabilidade)?
- [ ] Schemas Zod atualizados em `src/validations/userValidation.js` quando aplicável?
- [ ] Campo `password` continua omitido em todas as respostas da API?
- [ ] Verificação de ownership (`req.usuarioId`) preservada nas rotas protegidas?
- [ ] Sem `console.log` de debug ou credenciais hardcoded?
- [ ] Mensagem de commit segue Conventional Commits?

### 13.2 Antes do Push

- [ ] `npm test` passou com 100% dos testes verdes?
- [ ] `git diff` contém apenas os arquivos esperados?

### 13.3 Antes do PR

- [ ] Checklist 13.2 completo (comandos executados no terminal com exit code 0)
- [ ] Título no formato `tipo(escopo): descrição` (sem emojis)?
- [ ] Resumo de alta densidade (1 a 3 frases) citando rotas/módulos afetados?
- [ ] Tipo de Mudança listado verticalmente sem emojis?
- [ ] Changelog preenchido sem emojis e com verbos na 3ª pessoa do presente?
- [ ] Passos para teste claros e reprodutíveis?

---

## 14. Exemplos Completos

### 14.1 Bloquear Alteração de Campos Sensíveis no Update de Usuário

**Tarefa:** Garantir que `PUT /usuario/:id` rejeite ou ignore campos não permitidos como `avatar` e `links`

**Branch:** `fix/bloqueia-campos-restritos-edicao-usuario`

**Commits:**

```
fix(users): restringe payload de PUT /usuario/:id aos campos permitidos
test(users): garante bloqueio de avatar e links na rota de edicao
```

**Arquivos:** `src/validations/userValidation.js` + `src/controllers/userController.js` + `tests/user.test.js`

**PR:**

```markdown
## Resumo

Restringe o schema `edicaoSchema` (`src/validations/userValidation.js`) e o controlador `editarUsuario` (`src/controllers/userController.js`) na rota `PUT /usuario/:id` para aceitar exclusivamente `name`, `email`, `password` e `profession`, impedindo sobrescrita indevida de `avatar` e `links`.

## Tipo de Mudança

- [x] Fix
- [x] Test

## Changelog

### Fixes

- Restringe `PUT /usuario/:id` aos campos cadastrais permitidos no schema Zod e no controller

### Tests

- Adiciona teste de integração garantindo que `avatar` e `links` não sejam alterados via `PUT /usuario/:id`

## Como Testar

1. Rode `npm test` e confirme que os 15 testes de integração passam.
2. Rode `npm run dev`, autentique via `POST /login` e envie `PUT /usuario/:id` contendo `avatar` ou `links` no body, verificando o bloqueio.

## Checklist

- [x] Testes de integração passam (`npm test`)
- [x] Servidor inicia sem erros (`npm start`)
- [x] Apenas arquivos do escopo alterados
```

---

> **Versão 1.0** · Fonte única de verdade para agentes de IA · Mantido por Tharcio Santos
>
> | Versão | Data     | Mudanças                                                                                                                                             |
> | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 1.0    | Out/2026 | Cria manual operacional com padrão de Pull Request Gold Standard sem emojis, checklist de validação real e exemplos contextualizados da DevLinks API |
