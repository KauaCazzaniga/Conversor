// DOMContentLoaded garante que o JS só rode depois que o HTML existir na tela
document.addEventListener('DOMContentLoaded', () => {

    const inputCodigo = document.getElementById('inputCodigo');
    const selectMarca = document.getElementById('selectMarca');
    const btnBuscar = document.getElementById('btnBuscar');
    const resDiv = document.getElementById('resultado');
    const loader = document.getElementById('loader');

    // URL base da sua API Node.js (ajuste se necessário)
    const API_BASE_URL = 'http://localhost:3000/api/erros';

    async function executarBusa() {
        const codigo = inputCodigo.value.trim();
        const marca = selectMarca.value;

        // UI Status: Iniciando busca
        resDiv.innerHTML = "";
        loader.style.display = "block";
        btnBuscar.disabled = true;
        btnBuscar.innerText = "PROCESSANDO...";

        try {
            let urlBusca = "";
            let dados = [];

            // LÓGICA DE BUSCA INTEGRADA (Frontend-driven filtering)

            // Caso 1: Busca específica por Código (Mais comum)
            if (codigo) {
                urlBusca = `${API_BASE_URL}/codigo/${encodeURIComponent(codigo)}`;
                const response = await fetch(urlBusca);

                if (response.ok) {
                    dados = await response.json();

                    // Se uma marca específica foi selecionada, filtramos os resultados do código
                    if (marca !== 'todas' && dados.length > 0) {
                        dados = dados.filter(item => item.marca.toLowerCase() === marca.toLowerCase());
                    }
                } else if (response.status === 404) {
                    // Se buscou por código e deu 404, não precisamos tentar por marca
                    exibirMensagemNoResults(codigo, marca);
                    return;
                } else {
                    throw new Error("Falha na resposta da API.");
                }
            }
            // Caso 2: Busca apenas por Marca (Se o código estiver vazio)
            else if (marca !== 'todas') {
                urlBusca = `${API_BASE_URL}/marca/${encodeURIComponent(marca)}`;
                const response = await fetch(urlBusca);

                if (response.ok) {
                    dados = await response.json();
                } else if (response.status === 404) {
                    exibirMensagemNoResults(null, marca);
                    return;
                } else {
                    throw new Error("Falha na resposta da API.");
                }
            }
            // Caso 3: Ambos vazios
            else {
                resDiv.innerHTML = "<div class='mensagem'>⚠️ Por favor, informe um código de erro ou selecione uma marca específica para refinar a busca.</div>";
                inputCodigo.focus();
                return;
            }

            // Verificação final de dados
            if (!dados || dados.length === 0) {
                exibirMensagemNoResults(codigo, marca);
                return;
            }

            // RENDERIZAÇÃO DOS RESULTADOS (Cards Corporativos)
            dados.forEach(erro => {
                const card = document.createElement('div');
                card.className = 'card';

                // Tratamento seguro da solução (pode ser array ou string)
                let listaSolucoes = "";
                if (Array.isArray(erro.solucao) && erro.solucao.length > 0) {
                    listaSolucoes = erro.solucao.map(s => `<li>${s}</li>`).join('');
                } else if (typeof erro.solucao === 'string' && erro.solucao.trim() !== "") {
                    listaSolucoes = `<li>${erro.solucao}</li>`;
                } else {
                    listaSolucoes = `<li>Consulte o manual avançado do fabricante ou abra um chamado de Nível 2.</li>`;
                }

                card.innerHTML = `
                        <div class="card-header">
                            <span class="marca">${erro.marca || "Genérico"}</span>
                            <div class="codigo">${erro.codigo_erro || "SINTOMA"}</div>
                        </div>

                        <strong>Problema Detectado:</strong>
                        <p class="descricao">${erro.descricao_problema || "Descrição técnica não disponível."}</p>

                        <div class="solucao-titulo">Procedimento Técnico Recomendado</div>
                        <ul>
                            ${listaSolucoes}
                        </ul>
                    `;
                resDiv.appendChild(card);
            });

        } catch (error) {
            console.error("Erro na Requisição:", error);
            resDiv.innerHTML = `
                    <div class='mensagem mensagem-erro'>
                        <strong>⚠️ Falha Crítica de Conexão</strong><br><br>
                        Não foi possível estabelecer comunicação com o servidor de dados.<br>
                        Certifique-se de que o serviço backend (<code>server.js</code>) está operacional na porta 3000.
                    </div>`;
        } finally {
            // UI Status: Finalizado
            loader.style.display = "none";
            btnBuscar.disabled = false;
            btnBuscar.innerText = "Executar Diagnóstico";
        }
    }

    // Função utilitária para mensagens de "não encontrado"
    function exibirMensagemNoResults(codigo, marca) {
        let msg = "❌ Nenhum procedimento encontrado";
        if (codigo && marca !== 'todas') {
            msg += ` para o código <strong>${codigo}</strong> do fabricante <strong>${marca}</strong>.`;
        } else if (codigo) {
            msg += ` para o código <strong>${codigo}</strong>.`;
        } else {
            msg += ` para o fabricante <strong>${marca}</strong> na base atual.`;
        }
        resDiv.innerHTML = `<div class='mensagem'>${msg}<br>Verifique a grafia ou tente uma busca mais genérica.</div>`;
    }

    // ATRIBUIÇÃO DOS EVENTOS
    btnBuscar.addEventListener('click', executarBusa);

    inputCodigo.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            executarBusa();
        }
    });

    // Foco automático corporativo: já sai digitando
    inputCodigo.focus();
});
