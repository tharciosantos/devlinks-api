import { app } from './src/app.js';
import { mongo } from './src/db.js';

mongo();

const porta = process.env.PORT || 3000;
app.listen(porta, () => {
    console.log(`Servidor rodando perfeitamente na porta: ${porta}`);
});