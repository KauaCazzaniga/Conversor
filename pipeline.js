require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFExtract } = require('pdf.js-extract');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const extratorPdf = new PDFExtract();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


const DIRETORIO_MANUAIS = './manuais_pendentes';
const DIRETORIO_TXT = './textos_brutos';
const DIRETORIO_JSON = './dados_estruturados';
const DIRETORIO_CONCLUIDOS = './manuais_concluidos';

const REGEX_ERRO = /(Código.*Erro|Error.*Code|E-\d{2,4}|Falha|Troubleshooting|Solução de problemas)/i;

function inicializarPastas() {
    [DIRETORIO_MANUAIS, DIRETORIO_TXT, DIRETORIO_JSON, DIRETORIO_CONCLUIDOS].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
}

const aguardar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function extrairTextoDoPdf(caminhoPdf, caminhoTxt) {
    console.log(`   📄 Lendo PDF...`);
    const bufferDeDados = fs.readFileSync(caminhoPdf);
    const dadosPdf = await extratorPdf.extractBuffer(bufferDeDados, {});
    let textoRelevante = "";
    let paginasEncontradas = 0;

    dadosPdf.pages.forEach((pagina, index) => {
        const textoDaPagina = pagina.content.map(item => item.str).join(' ');
        if (REGEX_ERRO.test(textoDaPagina)) {
            textoRelevante += `--- PÁGINA ${index + 1} ---\n${textoDaPagina}\n\n`;
            paginasEncontradas++;
        }
    });

    if (paginasEncontradas > 0) {
        fs.writeFileSync(caminhoTxt, textoRelevante, 'utf8');
        return textoRelevante;
    } else {
        fs.writeFileSync(caminhoTxt, "NENHUM ERRO ENCONTRADO", 'utf8');
        return "NENHUM ERRO ENCONTRADO";
    }
}

async function estruturarComIA(textoBruto, nomeArquivo, caminhoJson) {
    if (textoBruto.includes("NENHUM ERRO ENCONTRADO")) {
        fs.writeFileSync(caminhoJson, JSON.stringify([], null, 2));
        return;
    }
    console.log(`   🧠 Enviando para Inteligência Artificial processar...`);
    const prompt = ` Atue como um engenheiro especialista em impressoras. Extraia todos os erros do texto fornecido.
                REGRA ABSOLUTA: Traduza TODAS as descrições de problemas e passos de solução para o PORTUGUÊS DO BRASIL (PT-BR) de forma clara e técnica.
                Retorne EXCLUSIVAMENTE um Array JSON válido com as chaves exatas: marca, codigo_erro, descricao_problema, solucao.
                Texto original:
                ${textoBruto}`;


    const result = await model.generateContent(prompt);
    let resposta = (await result.response.text()).trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');

    const dadosFinais = JSON.parse(resposta);
    fs.writeFileSync(caminhoJson, JSON.stringify(dadosFinais, null, 2), 'utf8');
}

async function iniciarPipeline() {
    console.log("Iniciando Motor...");
    inicializarPastas();

    const arquivosPdf = fs.readdirSync(DIRETORIO_MANUAIS).filter(f => f.toLowerCase().endsWith('.pdf'));

    for (const arquivo of arquivosPdf) {
        console.log(`\n🔄 Processando arquivo: ${arquivo}`);
        const caminhoPdf = path.join(DIRETORIO_MANUAIS, arquivo);
        const caminhoTxt = path.join(DIRETORIO_TXT, arquivo.replace(/\.[^/.]+$/, ".txt"));
        const caminhoJson = path.join(DIRETORIO_JSON, arquivo.replace(/\.[^/.]+$/, ".json"));
        const caminhoConcluido = path.join(DIRETORIO_CONCLUIDOS, arquivo);

        if (fs.existsSync(caminhoJson)) {
            console.log(`✅ Já foi extraído antes.`);
            // Se o JSON existe, mas o PDF continua nos pendentes, ele move agora
            if (fs.existsSync(caminhoPdf)) {
                fs.renameSync(caminhoPdf, caminhoConcluido);
                console.log(`   📦 Movido para concluídos.`);
            }
            continue;
        }

        try {
            let texto = fs.existsSync(caminhoTxt) ? fs.readFileSync(caminhoTxt, 'utf8') : await extrairTextoDoPdf(caminhoPdf, caminhoTxt);
            await estruturarComIA(texto, arquivo, caminhoJson);

            // Move o arquivo PDF para a pasta de concluídos após o sucesso
            fs.renameSync(caminhoPdf, caminhoConcluido);

            console.log(`✅ Sucesso final: JSON criado e PDF movido para manuais_concluidos.`);
            await aguardar(4000);
        } catch (e) {
            console.error(`❌ Erro no arquivo ${arquivo}: ${e.message}`);
        }
    }
    console.log("\n🏁 Fim da fila!");
}

iniciarPipeline();