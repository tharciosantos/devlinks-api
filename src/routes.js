import { Router } from "express";
import { rotaInicial, cadastrarUsuario, deletarUsuario, editarUsuario, loginUsuario, uploadFoto, pegarMeuPerfil, adicionarLink, pegarPerfilPublico, deletarLink } from './controllers/userController.js';
import { verificarToken } from "./middlewares/auth.js";
import upload from './config/upload.js';
import rateLimit from "express-rate-limit";

export const routes = Router();

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Muitas tentativas de login. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

const limiteCadastro = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { message: "Muitas tentativas de cadastro. Tente novamente em 1 hora." },
    standardHeaders: true,
    legacyHeaders: false,
});

routes.get('/p/:id', pegarPerfilPublico);
routes.get('/', rotaInicial);
routes.get('/meu-perfil', verificarToken, pegarMeuPerfil);
routes.post('/usuario', limiteCadastro, cadastrarUsuario);
routes.delete('/usuario/:id', verificarToken, deletarUsuario);
routes.put('/usuario/:id', verificarToken, editarUsuario);
routes.post('/login', limiteLogin, loginUsuario);
routes.patch('/usuario/foto', verificarToken, upload.single('foto'), uploadFoto);
routes.post('/usuario/link', verificarToken, adicionarLink);
routes.delete('/usuario/link/:idLink', verificarToken, deletarLink);