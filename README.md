# DevLinks API

API back-end do projeto DevLinks, responsável pelo cadastro e autenticação de usuários, gerenciamento de perfis e links e armazenamento de avatares no Cloudinary.

## Status do projeto

**Em evolução como projeto de portfólio (nível júnior/pleno).**

Os fluxos principais consumidos pelo DevLinks Web estão implementados, com validação de entrada via schemas Zod, controle de acesso e autorização por ownership, testes automatizados e hash seguro de senhas.

## Objetivo do projeto

O DevLinks API foi criado para fornecer os recursos de back-end da aplicação DevLinks Web. A API permite que usuários criem uma conta, façam login, gerenciem os links exibidos no perfil e enviem uma imagem de avatar.

O projeto também foi desenvolvido para praticar a construção de APIs robustas com Node.js e Express, persistência de dados NoSQL com MongoDB/Mongoose, autenticação com JWT e bcrypt, validação de dados com Zod, suíte de testes de integração com Vitest e integração com o Cloudinary.

## Demonstração ou consumo da API

- **API em produção:** [https://minha-api-lih7.onrender.com](https://minha-api-lih7.onrender.com)
- **Repositório da API:** [https://github.com/tharciosantos/devlinks-api](https://github.com/tharciosantos/devlinks-api)
- **Aplicação front-end em produção:** [https://devlinks-web-api.vercel.app/](https://devlinks-web-api.vercel.app/)
- **Repositório do front-end:** [https://github.com/tharciosantos/devlinks-web](https://github.com/tharciosantos/devlinks-web)

A API está publicada no Render e é consumida pela aplicação DevLinks Web em produção.

### Endpoints disponíveis

#### Rotas públicas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Retorna uma mensagem indicando que a API está respondendo. |
| `POST` | `/usuario` | Cadastra um usuário (validação Zod: nome min 2, email válido, senha min 6). |
| `POST` | `/login` | Valida credenciais e retorna um token JWT com expiração configurável (`JWT_EXPIRES`). |
| `GET` | `/p/:id` | Retorna nome, avatar, profissão e links de um perfil público. |

#### Rotas protegidas por JWT

As rotas protegidas esperam o token no cabeçalho `Authorization`:

```http
Authorization: Bearer <token>
```

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/meu-perfil` | Retorna o perfil associado ao token (sem o campo `password`). |
| `PUT` | `/usuario/:id` | Atualiza dados cadastrais (`name`, `email`, `password`, `profession`). Exige autorização de ownership (`id === req.usuarioId`). |
| `DELETE` | `/usuario/:id` | Exclui o usuário. Exige autorização de ownership (`id === req.usuarioId`). |
| `PATCH` | `/usuario/foto` | Envia uma imagem multipart e atualiza o avatar do usuário autenticado no Cloudinary. |
| `POST` | `/usuario/link` | Adiciona um link (`titulo` e `url` válida) ao perfil do usuário autenticado. |
| `DELETE` | `/usuario/link/:idLink` | Remove um link do perfil do usuário autenticado pelo identificador do link. |

## Funcionalidades e segurança implementadas

### Usuários e autenticação

- **Cadastro de usuário**: validação com Zod e verificação de duplicidade de e-mail antes da inserção.
- **Hash de senhas**: geração de hash com bcrypt via hook `pre('save')` tanto no cadastro quanto na atualização de senha via `.save()`.
- **Proteção de senhas**: o campo `password` nunca é exposto nas respostas da API (usando projeções e sanitização de objetos).
- **Login e JWT**: autenticação com credenciais e geração de token assinado, com suporte a expiração dinâmica via variável de ambiente `JWT_EXPIRES` (com fallback para `1h`).
- **Autorização e Ownership**: nas rotas `PUT /usuario/:id` e `DELETE /usuario/:id`, a comparação entre o identificador do parâmetro e o identificador do token é normalizada como `String`, bloqueando tentativas de acesso de outros usuários com status `403 Forbidden`.
- **Validação de e-mail na edição**: se o e-mail for modificado na rota de edição, a API verifica se ele já pertence a outro usuário antes de salvar.
- **Proteção de payload restrito**: a rota de edição aceita estritamente apenas os campos permitidos (`name`, `email`, `password`, `profession`), rejeitando alterações indevidas de `avatar` ou `links`.
- **Rate Limiting**: limite de tentativas aplicado nas rotas de login e cadastro com `express-rate-limit` (desativado automaticamente no ambiente de testes).

### Perfis e links

- Perfil público acessível por identificador contendo nome, avatar, profissão e links.
- Gerenciamento de links associados diretamente ao usuário através do identificador no token JWT.
- Validação com Zod de título obrigatório e formato válido de URL.

### Upload de avatar

- Upload via Multer e Cloudinary (`multer-storage-cloudinary`).
- Restrição de formatos (JPG, JPEG, PNG, WebP) e redimensionamento automático.

### Tratamento de erros

- Respostas padronizadas em JSON com mensagens claras de erro.
- Validações com Zod retornam status `400 Bad Request` com lista detalhada de falhas.
- Erros de Cast do Mongoose (ObjectId malformado) retornam `400 Bad Request`.
- Middleware centralizado para tratamento de exceções.

## Tecnologias utilizadas

- **Runtime:** Node.js (v20+)
- **Framework:** Express 5
- **Banco de Dados:** MongoDB com Mongoose
- **Validação:** Zod
- **Autenticação:** JSON Web Token (`jsonwebtoken`) e bcrypt
- **Upload:** Multer, Cloudinary e multer-storage-cloudinary
- **Segurança:** express-rate-limit, CORS
- **Testes:** Vitest, Supertest e mongodb-memory-server

## Estrutura geral do projeto

```text
devlinks-api/
├── index.js                       # Ponto de entrada do servidor e inicialização
├── src/
│   ├── app.js                     # Configuração do Express, middlewares e rotas
│   ├── config/
│   │   └── upload.js              # Configuração do Multer e Cloudinary
│   ├── controllers/
│   │   └── userController.js      # Controladores de usuários, links e autenticação
│   ├── middlewares/
│   │   ├── auth.js                # Middleware de validação do token JWT
│   │   └── validate.js            # Middleware de validação de schemas Zod
│   ├── models/
│   │   └── User.js                # Schema e hooks Mongoose do usuário
│   ├── validations/
│   │   └── userValidation.js      # Schemas Zod reutilizáveis
│   ├── db.js                      # Conexão com o banco MongoDB
│   └── routes.js                  # Mapeamento de rotas e limites
├── tests/
│   └── user.test.js               # Suíte de testes automatizados com Vitest
├── .env.example                   # Modelo limpo de variáveis de ambiente
└── package.json                   # Dependências e scripts do projeto
```

## Como executar localmente

### Pré-requisitos

- Node.js 20 ou superior
- npm
- Instância do MongoDB ou MongoDB Atlas
- Conta do Cloudinary (para upload de avatar)

### 1. Clone o repositório

```bash
git clone https://github.com/tharciosantos/devlinks-api.git
cd devlinks-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto copiando o modelo de `.env.example`:

```bash
cp .env.example .env
```

Preencha os valores necessários no `.env`.

### 4. Inicie a API em desenvolvimento

```bash
npm run dev
```

Por padrão a API roda na porta `3000` (ou na definida em `PORT`).

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| `MONGO_URL` | String de conexão com o MongoDB | `mongodb+srv://...` |
| `JWT_SECRET` | Chave secreta para assinar os tokens JWT | `sua_chave_secreta` |
| `JWT_EXPIRES` | Tempo de expiração do JWT (opcional, padrão: `1h`) | `1h`, `7d`, `24h` |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name da conta Cloudinary | `meu_cloud` |
| `CLOUDINARY_API_KEY` | Chave de API do Cloudinary | `1234567890` |
| `CLOUDINARY_API_SECRET` | Segredo de API do Cloudinary | `abcdef12345` |
| `PORT` | Porta HTTP da aplicação (opcional, padrão: `3000`) | `3000` |

Exemplo de `.env.example`:

```env
MONGO_URL=mongodb+srv://<seu_usuario>:<sua_senha>@<seu_cluster>.mongodb.net/<seu_banco>?appName=<seu_app>
JWT_SECRET=sua_chave_secreta_jwt
JWT_EXPIRES=1h
CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=sua_api_secret_aqui
PORT=3000
```

## Testes automatizados

A API conta com uma suíte de testes de integração automatizados utilizando **Vitest**, **Supertest** e **mongodb-memory-server** (não requer conexão com banco externo).

Cenários cobertos:
- Cadastro com sucesso (sem retorno de hash de senha).
- Rejeição de cadastro com e-mail duplicado.
- Rejeição de payloads inválidos por validação Zod (400).
- Login com credenciais válidas e retorno do token JWT.
- Rejeição de login com credenciais incorretas (401).
- Autorização de ownership: usuário autenticado só edita e deleta o próprio perfil (403 para outros usuários).
- Verificação de unicidade de e-mail ao editar dados do perfil.
- Bloqueio de campos restritos ou sensíveis no update (`avatar`, `links`).
- Adição e remoção de links com validação de formato de URL.

Para executar os testes:

```bash
# Executa todos os testes uma vez
npm test

# Executa os testes em modo watch (re-executa ao salvar arquivos)
npm run test:watch
```

## Próximos passos

- [ ] Implementação de Refresh Tokens e invalidação de sessão (blacklist ou revogação).
- [ ] Documentação interativa da API com OpenAPI/Swagger.
- [ ] Configuração de pipeline de CI/CD (GitHub Actions) para execução automática dos testes.
- [ ] Migração incremental para TypeScript para tipagem estática e maior manutenibilidade.

## Autor

**Nome:** Tharcio Santos  
**GitHub:** [https://github.com/tharciosantos](https://github.com/tharciosantos)  
**LinkedIn:** [https://www.linkedin.com/in/tharcio-santos-dev/](https://www.linkedin.com/in/tharcio-santos-dev/)  
**Portfólio:** [https://tharcio-portfolio.vercel.app/](https://tharcio-portfolio.vercel.app/)
