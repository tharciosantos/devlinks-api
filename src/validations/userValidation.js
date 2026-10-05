import { z } from "zod";

export const cadastroSchema = z.object({
    name: z.string({ required_error: "O nome é obrigatório." })
        .trim()
        .min(2, "O nome deve ter no mínimo 2 caracteres."),
    email: z.string({ required_error: "O e-mail é obrigatório." })
        .trim()
        .email("Formato de e-mail inválido."),
    password: z.string({ required_error: "A senha é obrigatória." })
        .min(6, "A senha deve ter no mínimo 6 caracteres.")
});

export const loginSchema = z.object({
    email: z.string({ required_error: "O e-mail é obrigatório." })
        .trim()
        .email("Formato de e-mail inválido."),
    password: z.string({ required_error: "A senha é obrigatória." })
        .min(1, "A senha é obrigatória.")
});

export const edicaoSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "O nome deve ter no mínimo 2 caracteres.")
        .optional(),
    email: z.string()
        .trim()
        .email("Formato de e-mail inválido.")
        .optional(),
    password: z.string()
        .min(6, "A senha deve ter no mínimo 6 caracteres.")
        .optional(),
    profession: z.string()
        .trim()
        .optional()
}).strict("Campos não permitidos foram fornecidos.");

export const linkSchema = z.object({
    titulo: z.string({ required_error: "O título é obrigatório." })
        .trim()
        .min(1, "O título é obrigatório."),
    url: z.string({ required_error: "A URL é obrigatória." })
        .trim()
        .url("Formato de URL inválido.")
});
