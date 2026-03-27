require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DIRETORIO_JSON = './dados_estruturados';
const URI_BANCO = process.env.MONGODB_URI;

if (!URI_BANCO) {
    console.error("❌ ERRO FATAL: MONGODB_URI não encontrada no arquivo .env");
    process.exit(1);
}

const esquemaErro = new mongoose.Schema({
    marca: { type: String, required: true, index: true },
    codigo_erro: { type: String, required: true, index: true },
    descricao_problema: { type: String, required: true },
    solucao: { type: [String], required: true }
}, { timestamps: true });

const ErroModelo = mongoose.model('Erro', esquemaErro);

async function injetarDados() {
    try {
        console.log("⏳ Conectando ao MongoDB...");
        await mongoose.connect(URI_BANCO);
        console.log("✅ Conectado ao banco com sucesso!\n");

        if (!fs.existsSync(DIRETORIO_JSON)) {
            console.error("❌ A pasta dados_estruturados não existe. Rode o pipeline primeiro.");
            process.exit(1);
        }

        const arquivosJson = fs.readdirSync(DIRETORIO_JSON).filter(f => f.endsWith('.json'));
        console.log(`📂 Encontrados ${arquivosJson.length} arquivos JSON para processar.`);

        let totalErrosInseridos = 0;

        for (const arquivo of arquivosJson) {
            const caminhoArquivo = path.join(DIRETORIO_JSON, arquivo);
            const conteudoRaw = fs.readFileSync(caminhoArquivo, 'utf8');
            const dados = JSON.parse(conteudoRaw);

            if (!Array.isArray(dados) || dados.length === 0) {
                console.log(`⏭️ O arquivo ${arquivo} está vazio. Pulando...`);
                continue;
            }

            // ========================================================
            // A MÁGICA DE SENIOR: Sanitização de Dados (Data Cleansing)
            // ========================================================
            const dadosSanitizados = dados.map(item => ({
                marca: item.marca || "Marca Desconhecida",
                codigo_erro: item.codigo_erro || "SINTOMA_GERAL", // Garante que nunca vai vazio
                descricao_problema: item.descricao_problema || "Descrição não informada",
                solucao: Array.isArray(item.solucao) && item.solucao.length > 0 ? item.solucao : ["Consulte um técnico."]
            }));

            // Tenta inserir o lote sanitizado
            await ErroModelo.insertMany(dadosSanitizados);

            totalErrosInseridos += dadosSanitizados.length;
            console.log(`   🚀 Sucesso: Injetados ${dadosSanitizados.length} erros do manual ${arquivo}.`);
        }

        console.log("\n=================================================");
        console.log(`🏁 CARGA FINALIZADA COM SUCESSO!`);
        console.log(`📊 Total de novos erros cadastrados: ${totalErrosInseridos}`);
        console.log("=================================================");

    } catch (erro) {
        console.error("\n❌ Falha crítica durante a injeção de dados:");
        console.error(erro.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Conexão com o banco de dados encerrada.");
        process.exit(0);
    }
}

injetarDados();