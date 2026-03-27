require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ==========================================
// 1. CONFIGURAÇÕES INICIAIS
// ==========================================
const app = express();
const PORTA = process.env.PORT || 3000;
const URI_BANCO = process.env.MONGODB_URI;

// Middlewares (Intermediários)
app.use(cors()); // Permite que qualquer site faça requisições para esta API
app.use(express.json()); // Permite que a API entenda requisições no formato JSON

// ==========================================
// 2. CONEXÃO COM O BANCO E MODELO
// ==========================================
mongoose.connect(URI_BANCO)
    .then(() => console.log(' Conectado ao MongoDB Atlas!'))
    .catch(err => {
        console.error(' Erro ao conectar no banco:', err.message);
        process.exit(1);
    });

const esquemaErro = new mongoose.Schema({
    marca: String,
    codigo_erro: String,
    descricao_problema: String,
    solucao: [String]
});

const ErroModelo = mongoose.model('Erro', esquemaErro);

// ==========================================
// 3. ROTAS DA API (Endpoints)
// ==========================================

// Rota 1: Rota de teste para ver se a API está online
app.get('/', (req, res) => {
    res.json({ mensagem: 'API de Erros de Impressoras Online e Operante! ️' });
});

// Rota 2: Buscar TODOS os erros (Limitado a 50 para não travar o navegador)
app.get('/api/erros', async (req, res) => {
    try {
        const erros = await ErroModelo.find().limit(50);
        res.json(erros);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha no servidor ao buscar erros.' });
    }
});

// Rota 3: Busca Inteligente por Código (Ex: /api/erros/codigo/E-01)
app.get('/api/erros/codigo/:codigoDigitado', async (req, res) => {
    try {
        const codigo = req.params.codigoDigitado;
        // O 'i' na RegExp significa "case-insensitive" (ignora maiúsculas/minúsculas)
        const regexCodigo = new RegExp(codigo, 'i');

        const resultados = await ErroModelo.find({ codigo_erro: regexCodigo });

        if (resultados.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhum erro encontrado com este código.' });
        }
        res.json(resultados);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha na busca por código.' });
    }
});

// Rota 4: Busca por Marca (Ex: /api/erros/marca/Epson)
app.get('/api/erros/marca/:nomeMarca', async (req, res) => {
    try {
        const marca = req.params.nomeMarca;
        const regexMarca = new RegExp(marca, 'i');

        const resultados = await ErroModelo.find({ marca: regexMarca });
        res.json(resultados);
    } catch (erro) {
        res.status(500).json({ erro: 'Falha na busca por marca.' });
    }
});

// ==========================================
// 4. LIGAR O SERVIDOR
// ==========================================
app.listen(PORTA, () => {
    console.log(`\n Servidor rodando na porta ${PORTA}`);
    console.log(` Teste no navegador: http://localhost:${PORTA}/api/erros`);
});