import { Router } from "express";
import { rotaInicial, cadastrarUsuario, deletarUsuario, editarUsuario, loginUsuario, uploadFoto, pegarMeuPerfil, adicionarLink, pegarPerfilPublico, deletarLink } from './controllers/userController.js';
import { verificarToken } from "./middlewares/auth.js";
import { validarCorpo } from "./middlewares/validate.js";
import { cadastroSchema, loginSchema, edicaoSchema, linkSchema } from "./validations/userValidation.js";
import upload from './config/upload.js';
import rateLimit from "express-rate-limit";

export const routes = Router();

const isTest = process.env.NODE_ENV === "test";

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 0 : 5,
    message: { message: "Muitas tentativas de login. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
});

const limiteCadastro = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: isTest ? 0 : 3,
    message: { message: "Muitas tentativas de cadastro. Tente novamente em 1 hora." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
});

routes.get('/p/:id', pegarPerfilPublico);
routes.get('/', rotaInicial);
routes.get('/meu-perfil', verificarToken, pegarMeuPerfil);
routes.post('/usuario', limiteCadastro, validarCorpo(cadastroSchema), cadastrarUsuario);
routes.delete('/usuario/:id', verificarToken, deletarUsuario);
routes.put('/usuario/:id', verificarToken, validarCorpo(edicaoSchema), editarUsuario);
routes.post('/login', limiteLogin, validarCorpo(loginSchema), loginUsuario);
routes.patch('/usuario/foto', verificarToken, upload.single('foto'), uploadFoto);
routes.post('/usuario/link', verificarToken, validarCorpo(linkSchema), adicionarLink);
routes.delete('/usuario/link/:idLink', verificarToken, deletarLink);