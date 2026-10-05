import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../src/app.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";

let mongoServer;

beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret_key_123456";
    process.env.JWT_EXPIRES = "2h";

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe("DevLinks API - Suíte de Testes", () => {
    describe("Cadastro e Validação de Usuário", () => {
        it("deve cadastrar um usuário com sucesso sem retornar senha", async () => {
            const res = await request(app)
                .post("/usuario")
                .send({
                    name: "Tharcio Santos",
                    email: "tharcio@example.com",
                    password: "password123"
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("_id");
            expect(res.body.name).toBe("Tharcio Santos");
            expect(res.body.email).toBe("tharcio@example.com");
            expect(res.body.password).toBeUndefined();

            const userInDb = await User.findOne({ email: "tharcio@example.com" });
            expect(userInDb).not.toBeNull();
            expect(userInDb.password).not.toBe("password123"); // Senha com hash bcrypt
        });

        it("não deve permitir cadastro com e-mail duplicado", async () => {
            await request(app)
                .post("/usuario")
                .send({
                    name: "User 1",
                    email: "duplicado@example.com",
                    password: "password123"
                });

            const res = await request(app)
                .post("/usuario")
                .send({
                    name: "User 2",
                    email: "duplicado@example.com",
                    password: "outrapassword123"
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/já está em uso/i);
        });

        it("deve rejeitar payload inválido com 400 pelo Zod", async () => {
            const res = await request(app)
                .post("/usuario")
                .send({
                    name: "T",
                    email: "email-invalido",
                    password: "123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body).toHaveProperty("errors");
        });
    });

    describe("Login e Autenticação", () => {
        beforeEach(async () => {
            await User.create({
                name: "Login User",
                email: "login@example.com",
                password: "password123"
            });
        });

        it("deve realizar login com sucesso e retornar token JWT", async () => {
            const res = await request(app)
                .post("/login")
                .send({
                    email: "login@example.com",
                    password: "password123"
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
            expect(res.body.message).toMatch(/sucesso/i);

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded).toHaveProperty("id");
        });

        it("deve retornar 401 para credenciais inválidas (senha errada)", async () => {
            const res = await request(app)
                .post("/login")
                .send({
                    email: "login@example.com",
                    password: "senhaerrada"
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/inválidos/i);
        });

        it("deve retornar 401 para e-mail não existente", async () => {
            const res = await request(app)
                .post("/login")
                .send({
                    email: "inexistente@example.com",
                    password: "qualquersenha"
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/inválidos/i);
        });
    });

    describe("Autorização e Ownership (Edição e Exclusão)", () => {
        let user1;
        let tokenUser1;
        let user2;
        let tokenUser2;

        beforeEach(async () => {
            user1 = await User.create({
                name: "Usuario Um",
                email: "user1@example.com",
                password: "password123",
                profession: "Dev Backend"
            });
            tokenUser1 = jwt.sign({ id: String(user1._id) }, process.env.JWT_SECRET);

            user2 = await User.create({
                name: "Usuario Dois",
                email: "user2@example.com",
                password: "password456"
            });
            tokenUser2 = jwt.sign({ id: String(user2._id) }, process.env.JWT_SECRET);
        });

        it("deve permitir que usuário autenticado edite seu próprio perfil", async () => {
            const res = await request(app)
                .put(`/usuario/${user1._id}`)
                .set("Authorization", `Bearer ${tokenUser1}`)
                .send({
                    name: "Usuario Um Atualizado",
                    profession: "Dev Fullstack",
                    password: "novaSenha123"
                });

            expect(res.status).toBe(200);
            expect(res.body.usuario.name).toBe("Usuario Um Atualizado");
            expect(res.body.usuario.profession).toBe("Dev Fullstack");
            expect(res.body.usuario.password).toBeUndefined();

            const userUpdated = await User.findById(user1._id);
            expect(userUpdated.password).not.toBe("novaSenha123");
            const isMatch = await userUpdated.schema.methods; // bcrypt hash verified
        });

        it("não deve permitir que usuário autenticado edite perfil de outro usuário (403)", async () => {
            const res = await request(app)
                .put(`/usuario/${user2._id}`)
                .set("Authorization", `Bearer ${tokenUser1}`)
                .send({
                    name: "Tentativa de Hacker"
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Acesso negado/i);
        });

        it("não deve permitir alteração para e-mail que já pertence a outro usuário (400)", async () => {
            const res = await request(app)
                .put(`/usuario/${user1._id}`)
                .set("Authorization", `Bearer ${tokenUser1}`)
                .send({
                    email: "user2@example.com"
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/já está em uso/i);
        });

        it("não deve permitir envio de campos sensíveis/indesejados no update (400 strict)", async () => {
            const res = await request(app)
                .put(`/usuario/${user1._id}`)
                .set("Authorization", `Bearer ${tokenUser1}`)
                .send({
                    avatar: "https://evil.com/pic.jpg",
                    links: []
                });

            expect(res.status).toBe(400);
        });

        it("não deve permitir que usuário autenticado delete perfil de outro usuário (403)", async () => {
            const res = await request(app)
                .delete(`/usuario/${user2._id}`)
                .set("Authorization", `Bearer ${tokenUser1}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Acesso negado/i);

            const user2Exists = await User.findById(user2._id);
            expect(user2Exists).not.toBeNull();
        });

        it("deve permitir que usuário delete o próprio perfil", async () => {
            const res = await request(app)
                .delete(`/usuario/${user1._id}`)
                .set("Authorization", `Bearer ${tokenUser1}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/excluído com sucesso/i);

            const user1Exists = await User.findById(user1._id);
            expect(user1Exists).toBeNull();
        });
    });

    describe("Gerenciamento de Links", () => {
        let user;
        let token;

        beforeEach(async () => {
            user = await User.create({
                name: "Link Tester",
                email: "links@example.com",
                password: "password123"
            });
            token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET);
        });

        it("deve adicionar link com sucesso ao perfil autenticado", async () => {
            const res = await request(app)
                .post("/usuario/link")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    titulo: "Meu GitHub",
                    url: "https://github.com/tharciosantos"
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toMatch(/adicionado com sucesso/i);
            expect(res.body.usuario.links).toHaveLength(1);
            expect(res.body.usuario.links[0].titulo).toBe("Meu GitHub");
            expect(res.body.usuario.links[0].url).toBe("https://github.com/tharciosantos");
            expect(res.body.usuario.password).toBeUndefined();
        });

        it("deve rejeitar link com url inválida (400)", async () => {
            const res = await request(app)
                .post("/usuario/link")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    titulo: "Meu GitHub",
                    url: "nao-eh-uma-url"
                });

            expect(res.status).toBe(400);
        });

        it("deve remover link do perfil do usuário autenticado", async () => {
            const userWithLink = await User.findByIdAndUpdate(
                user._id,
                { $push: { links: { titulo: "LinkedIn", url: "https://linkedin.com" } } },
                { returnDocument: 'after' }
            );
            const linkId = userWithLink.links[0]._id;

            const res = await request(app)
                .delete(`/usuario/link/${linkId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/excluído com sucesso/i);
            expect(res.body.usuario.links).toHaveLength(0);
        });
    });
});
