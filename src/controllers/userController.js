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

        if (id !== req.usuarioId) {
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
        error.message = "Erro técnico ao tentar excluir o usuário.";
        error.status = 500;
        next(error);
    }
};

export const editarUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, profession } = req.body;

        if (id !== req.usuarioId) {
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

        if (name) usuario.name = name;
        if (email) usuario.email = email;
        if (password) usuario.password = password;
        if (profession !== undefined) usuario.profession = profession;

        await usuario.save();

        const { password: _, ...userSemSenha } = usuario.toObject();
        res.json({ message: "Usuário alterado com sucesso.", usuario: userSemSenha });
    } catch (error) {
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

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
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
            { new: true }
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

        if (!titulo || !url) {
            const error = new Error("Título e URL são obrigatórios.");
            error.status = 400;
            return next(error);
        }

        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.usuarioId,
            { $push: { links: { titulo, url } } },
            { new: true }
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
            { new: true }
        ).select("-password");

        if (!usuarioAtualizado) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.status(200).json({
            message: "Link excluído com sucesso!",
            usuario: usuarioAtualizado
        });

    } catch (error) {
        error.message = "Erro ao excluir o link.";
        error.status = 500;
        next(error)
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
        error.message = "Erro ao carregar o perfil.";
        error.status = 500;
        next(error);
    }
}

