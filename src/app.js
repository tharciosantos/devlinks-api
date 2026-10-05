import express from 'express';
import cors from 'cors';
import { routes } from './src/routes.js';

export const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://devlinks-web-api.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(routes);

app.use((err, req, res, next) => {
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Identificador inválido.' });
    }
    const status = err.status || 500;
    const message = err.message || "Erro interno no servidor.";
    res.status(status).json({ message });
});
