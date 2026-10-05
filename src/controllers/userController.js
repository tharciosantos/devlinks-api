import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const rotaInicial = (req, res) => {
    res.json({ message: "Bateu na rota inicial" });
}

export const cadastrarUsuario = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            const error = new Error("Todas as informações são obrigatórias!");
            error.status = 400;
            return next(error);
        }

        const usuarioExistente = await User.findOne({ email });

        if (usuarioExistente) { // Se EXISTIR, barramos o cadastro
            const error = new Error("Este e-mail já está em uso.");
            error.status = 400;
            return next(error);
        }

        const newUser = await User.create({ name, email, password });
        const { password: _, ...userSemSenha } = newUser.toObject();
        return res.status(201).json(userSemSenha);

    } catch (error) {
        error.message = "Erro ao adicionar o usuário.";
        error.status = 500;
        next(error);
    }
}

export const deletarUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (String(id) !== String(req.usuarioId)) {
            const error = new Error("Acesso negado. Você não pode excluir este usuário.");
            error.status = 403;
            return next(error);
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            const error = new Error("Usuário não encontrado para exclusão.");
            error.status = 404;
            return next(error);
        }

        res.json({ message: "Usuário excluído com sucesso." });
    } catch (error) {
        if (error.name === "CastError") {
            const err = new Error("Identificador inválido.");
            err.status = 400;
            return next(err);
        }
        error.message = "Erro técnico ao tentar excluir o usuário.";
        error.status = 500;
        next(error);
    }
};

export const editarUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, profession } = req.body;

        if (String(id) !== String(req.usuarioId)) {
            const error = new Error("Acesso negado. Você não pode alterar este usuário.");
            error.status = 403;
            return next(error);
        }

        const usuario = await User.findById(id);

        if (!usuario) {
            const error = new Error("Usuário não encontrado para edição.");
            error.status = 404;
            return next(error);
        }

        if (email && email !== usuario.email) {
            const emailExistente = await User.findOne({ email });
            if (emailExistente && String(emailExistente._id) !== String(usuario._id)) {
                const error = new Error("Este e-mail já está em uso por outro usuário.");
                error.status = 400;
                return next(error);
            }
            usuario.email = email;
        }

        if (name !== undefined) usuario.name = name;
        if (password !== undefined) usuario.password = password;
        if (profession !== undefined) usuario.profession = profession;

        await usuario.save();

        const { password: _, ...userSemSenha } = usuario.toObject();
        res.json({ message: "Usuário alterado com sucesso.", usuario: userSemSenha });
    } catch (error) {
        if (error.name === "CastError") {
            const err = new Error("Identificador inválido.");
            err.status = 400;
            return next(err);
        }
        error.message = "Erro técnico ao tentar editar o usuário.";
        error.status = 500;
        next(error);
    }
};

export const loginUsuario = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // Padronizando o erro de Login com o Ralo
        if (!user) {
            const error = new Error("Usuário ou senha inválidos.");
            error.status = 401;
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const error = new Error("Usuário ou senha inválidos.");
            error.status = 401;
            return next(error);
        }

        const expiresIn = process.env.JWT_EXPIRES || '1h';
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.status(200).json({
            message: "Login realizado com sucesso!",
            token: token
        });

    } catch (error) {
        error.message = "Erro interno no servidor.";
        error.status = 500;
        next(error);
    }
}

export const uploadFoto = async (req, res, next) => {
    try {
        if (!req.file) {
            const error = new Error("Nenhuma imagem foi enviada.");
            error.status = 400;
            return next(error);
        }

        const linkDaFoto = req.file.path;
        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.usuarioId,
            { avatar: linkDaFoto },
            { returnDocument: 'after' }
        );

        if (!usuarioAtualizado) {
            const error = new Error("Usuário não encontrado.");
            error.status = 404;
            return next(error);
        }

        return res.status(200).json({
            message: "Foto atualizada com sucesso!",
            avatar: linkDaFoto
        });

    } catch (error) {
        error.message = "Erro ao atualizar a foto.";
        error.status = 500;
        next(error);
    }
}

export const pegarMeuPerfil = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.usuarioId).select("-password");

        if (!usuario) {
            const error = new Error("Usuário não encontrado.");
            error.status = 404;
            return next(error);
        }

        res.json(usuario);
    } catch (error) {
        error.message = "Erro ao buscar seu perfil.";
        error.status = 500;
        next(error);
    }
}

export const adicionarLink = async (req, res, next) => {
    try {
        const { titulo, url } = req.body;

        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.usuarioId,
            { $push: { links: { titulo, url } } },
            { returnDocument: 'after' }
        ).select("-password");

        if (!usuarioAtualizado) {
            const error = new Error("Usuário não encontrado.");
            error.status = 404;
            return next(error);
        }

        res.status(201).json({
            message: "Link adicionado com sucesso!",
            usuario: usuarioAtualizado
        });

    } catch (error) {
        error.message = "Erro ao salvar o link.";
        error.status = 500;
        next(error);
    }
}

export const deletarLink = async (req, res, next) => {
    try {
        const { idLink } = req.params;

        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.usuarioId,
            { $pull: { links: { _id: idLink } } },
            { returnDocument: 'after' }
        ).select("-password");

        if (!usuarioAtualizado) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.status(200).json({
            message: "Link excluído com sucesso!",
            usuario: usuarioAtualizado
        });

    } catch (error) {
        if (error.name === "CastError") {
            const err = new Error("Identificador inválido.");
            err.status = 400;
            return next(err);
        }
        error.message = "Erro ao excluir o link.";
        error.status = 500;
        next(error);
    }
}

export const pegarPerfilPublico = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuario = await User.findById(id).select("name avatar profession links");

        if (!usuario) {
            const error = new Error("Perfil não encontrado.");
            error.status = 404;
            return next(error);
        }

        res.json(usuario);
    } catch (error) {
        if (error.name === "CastError") {
            const err = new Error("Identificador inválido.");
            err.status = 400;
            return next(err);
        }
        error.message = "Erro ao carregar o perfil.";
        error.status = 500;
        next(error);
    }
}

