import express from 'express';
import cors from 'cors';
import { routes } from './src/routes.js';
import { mongo } from './src/db.js';

const app = express();


app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://devlinks-web-api.vercel.app/'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


mongo();


app.use(routes);


app.use((err, req, res, next) => {
    console.error("LOG DE ERRO:", err);
    const status = err.status || 500;
    const message = err.message || "Erro interno no servidor.";
    res.status(status).json({ message });
});


const porta = process.env.PORT || 3000;
app.listen(porta, () => {
    console.log(`Servidor rodando perfeitamente na porta: ${porta}`);
});