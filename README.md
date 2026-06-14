# DevLinks API

API back-end do projeto DevLinks, responsável pelo cadastro e autenticação de usuários, gerenciamento de perfis e links e armazenamento de avatares no Cloudinary.

## Status do projeto

**Em evolução como projeto de estudo.**

Os fluxos principais utilizados pelo DevLinks Web estão implementados. O projeto ainda possui melhorias planejadas relacionadas a testes, validação, documentação e controle de acesso.

## Objetivo do projeto

O DevLinks API foi criado para fornecer os recursos de back-end da aplicação DevLinks Web. A API permite que usuários criem uma conta, façam login, gerenciem os links exibidos no perfil e enviem uma imagem de avatar.

O projeto também foi desenvolvido para praticar a construção de APIs com Node.js e Express, persistência de dados NoSQL, autenticação com JWT, uso de middlewares e integração com um serviço externo de armazenamento de imagens.

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
| `POST` | `/usuario` | Cadastra um usuário. |
| `POST` | `/login` | Valida as credenciais e retorna um token JWT. |
| `GET` | `/p/:id` | Retorna nome, avatar e links de um perfil público. |

#### Rotas protegidas por JWT

As rotas protegidas esperam o token no cabeçalho `Authorization`:

```http
Authorization: Bearer <token>
```

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/meu-perfil` | Retorna o perfil associado ao token. |
| `PUT` | `/usuario/:id` | Atualiza nome, e-mail e senha do usuário informado. |
| `DELETE` | `/usuario/:id` | Exclui o usuário informado. |
| `PATCH` | `/usuario/foto` | Envia uma imagem e atualiza o avatar do usuário autenticado. |
| `POST` | `/usuario/link` | Adiciona um link ao perfil do usuário autenticado. |
| `DELETE` | `/usuario/link/:idLink` | Remove um link do perfil do usuário autenticado. |

> As rotas `PUT /usuario/:id` e `DELETE /usuario/:id` exigem autenticação, mas a implementação atual ainda não compara o `id` da URL com o identificador extraído do token. Dessa forma, possuir um token válido não garante que a operação esteja limitada ao próprio cadastro do usuário autenticado.

> A atualização de senha pela rota `PUT /usuario/:id` ainda não aciona o hook de hash definido no model, pois utiliza uma atualização direta do Mongoose. Esse fluxo precisa ser revisto antes de ser tratado como uma alteração segura de senha.

## Funcionalidades implementadas

### Usuários e autenticação

- Cadastro de usuário com nome, e-mail e senha.
- Verificação de e-mail já cadastrado.
- Hash da senha de novos usuários com bcrypt antes da gravação no banco.
- Login com e-mail e senha.
- Geração de token JWT com duração fixa de uma hora.
- Middleware para validar o token das rotas privadas.
- Consulta do perfil associado ao usuário autenticado sem retornar a senha.
- Atualização e exclusão de usuários por identificador.

### Perfis e links

- Perfil público acessível pelo identificador do usuário.
- Armazenamento dos links como subdocumentos no documento do usuário.
- Adição de links com título e URL.
- Remoção de links pelo identificador do subdocumento.

### Upload de avatar

- Recebimento de imagem com Multer pelo campo `foto`.
- Envio do arquivo para o Cloudinary.
- Formatos permitidos: JPG, JPEG, PNG e WebP.
- Limitação da transformação da imagem para até 500 por 500 pixels.
- Armazenamento da URL retornada pelo Cloudinary no perfil do usuário.

### API e tratamento de erros

- Configuração de CORS para o ambiente local do DevLinks Web e para o front-end publicado na Vercel.
- Leitura de corpos JSON com o Express.
- Middleware central para respostas de erro.
- Conexão com o MongoDB por meio do Mongoose.

## Tecnologias utilizadas

### Back-end

- Node.js
- Express 5
- CORS

### Banco de dados

- MongoDB
- Mongoose

### Autenticação

- JSON Web Token (`jsonwebtoken`)
- bcrypt

### Upload de arquivos

- Multer
- Cloudinary
- multer-storage-cloudinary

## Estrutura geral do projeto

```text
devlinks-api/
├── index.js                       # Inicialização do Express e conexão com o banco
├── src/
│   ├── config/
│   │   └── upload.js              # Configuração do Multer e Cloudinary
│   ├── controllers/
│   │   └── userController.js      # Regras de usuários, autenticação, perfis e links
│   ├── middlewares/
│   │   └── auth.js                # Validação do token JWT
│   ├── models/
│   │   └── User.js                # Schema de usuário e subdocumentos de links
│   ├── db.js                      # Conexão com o MongoDB
│   └── routes.js                  # Definição das rotas públicas e protegidas
├── .env.example                   # Referência das variáveis de ambiente
└── package.json                   # Dependências e scripts do projeto
```

## Como executar localmente

### Pré-requisitos

- Node.js 20 ou superior
- npm
- Instância do MongoDB ou projeto no MongoDB Atlas
- Conta e credenciais do Cloudinary para utilizar o upload de avatar

O projeto utiliza a opção nativa `--env-file` do Node.js no script de desenvolvimento, por isso é recomendado usar Node.js 20 ou superior.

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

Crie um arquivo `.env` na raiz do projeto com base nas variáveis listadas na próxima seção.

> O `.env.example` atual possui uma linha de texto sem comentário antes das variáveis do Cloudinary. Até que esse arquivo seja corrigido, revise essa linha ao usá-lo como referência.

### 4. Inicie a API

```bash
npm run dev
```

Por padrão, a API utiliza a porta `3000`. A variável `PORT` pode ser definida pelo ambiente de hospedagem para alterar essa porta.

## Variáveis de ambiente

Não publique valores reais ou credenciais no repositório.

| Variável | Finalidade |
| --- | --- |
| `MONGO_URL` | String de conexão com o MongoDB. |
| `JWT_SECRET` | Chave usada para assinar e validar os tokens JWT. |
| `JWT_EXPIRES` | Está presente no `.env.example`, mas ainda não é utilizada pelo código. A expiração atual está definida como uma hora no controller. |
| `CLOUDINARY_CLOUD_NAME` | Nome da conta ou cloud do Cloudinary. |
| `CLOUDINARY_API_KEY` | Chave de API do Cloudinary. |
| `CLOUDINARY_API_SECRET` | Segredo da API do Cloudinary. |
| `PORT` | Porta da API. É opcional, utiliza `3000` como padrão e é lida pelo código, embora não esteja listada no `.env.example` atual. |

Exemplo sem valores sensíveis:

```env
MONGO_URL=
JWT_SECRET=
JWT_EXPIRES=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=3000
```

## Testes

O projeto ainda não possui uma suíte de testes automatizados.

O script `npm test` existente no `package.json` é apenas o placeholder padrão e encerra a execução com a mensagem `Error: no test specified`. Portanto, ele não representa testes implementados.

## Aprendizados

- Criação de uma API HTTP com Node.js e Express.
- Organização de responsabilidades entre rotas, controllers, middlewares e models.
- Modelagem de documentos e subdocumentos com MongoDB e Mongoose.
- Uso dos operadores `$push` e `$pull` para gerenciar links incorporados ao usuário.
- Hash e comparação de senhas com bcrypt.
- Geração e validação de tokens JWT.
- Proteção de rotas por middleware.
- Upload de arquivos com Multer e Cloudinary.
- Configuração de CORS para comunicação com o front-end.
- Tratamento centralizado de erros no Express.

## Próximos passos

- **Planejado:** implementar testes automatizados para autenticação, usuários, links e upload de avatar.
- **Planejado:** validar se o usuário autenticado pode editar ou excluir o identificador informado na rota.
- **Planejado:** garantir a aplicação do hash ao atualizar a senha de um usuário.
- **Planejado:** adicionar validação de dados com schemas reutilizáveis.
- **Planejado:** utilizar `JWT_EXPIRES` na configuração de expiração do token ou removê-la do ambiente.
- **Planejado:** corrigir e padronizar o arquivo `.env.example`.
- **Planejado:** documentar exemplos de requisição e resposta dos endpoints.
- **Planejado:** adicionar um script de execução para produção.

## Autor

**Nome:** Tharcio Santos  
**GitHub:** [https://github.com/tharciosantos](https://github.com/tharciosantos)  
**LinkedIn:** [https://www.linkedin.com/in/tharcio-santos-dev/](https://www.linkedin.com/in/tharcio-santos-dev/)  
**Portfólio:** [https://tharcio-portfolio.vercel.app/](https://tharcio-portfolio.vercel.app/)
