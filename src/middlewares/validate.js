import { ZodError } from "zod";

export const validarCorpo = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError || error?.name === "ZodError") {
            const issues = error.issues || error.errors || [];
            const mensagens = issues.map(err => err.message);
            return res.status(400).json({
                message: mensagens[0] || "Dados inválidos.",
                errors: mensagens
            });
        }
        next(error);
    }
};
