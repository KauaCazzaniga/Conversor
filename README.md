# Conversor (Impressoras)

Pipeline completo para converter manuais em PDF em uma base de erros estruturada, injetar no MongoDB e disponibilizar uma API para consulta, com uma interface web simples em `index.html`.

## Possibilidades do projeto

- Extrair somente páginas relevantes de PDFs (códigos de erro, troubleshooting, falhas) e salvar em texto.
- Estruturar automaticamente os erros com IA (Gemini) e gerar JSON padronizado.
- Injetar os erros estruturados no MongoDB com saneamento de dados.
- Expor uma API REST para consulta por código e por marca.
- Consumir a API via uma interface web (arquivo `index.html`).

## Requisitos

- Node.js 18+ (recomendado)
- Conta no MongoDB Atlas (ou MongoDB local)
- Chave da API Gemini

## Configuração do `.env`

Crie um arquivo `.env` na raiz (ele já está no `.gitignore`):

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.exemplo.mongodb.net/conversor
GEMINI_API_KEY=sua-chave-gemini
PORT=3000
```

## Instalação

```bash
npm install
```

## Fluxo completo (passo a passo)

1. Coloque os PDFs na pasta `manuais_pendentes/`.
2. Rode o pipeline para extrair e estruturar os dados:
   ```bash
   node pipeline.js
   ```
   Isso gera:
   - textos em `textos_brutos/`
   - JSONs em `dados_estruturados/`
   - move PDFs para `manuais_concluidos/`

3. Injete os JSONs no MongoDB:
   ```bash
   node populador.js
   ```

4. Suba a API:
   ```bash
   node server.js
   ```

5. Abra o `index.html` e faça buscas na interface.

## Endpoints da API

- `GET /`  
  Retorna status da API.

- `GET /api/erros`  
  Retorna até 50 erros.

- `GET /api/erros/codigo/:codigo`  
  Busca por código (case-insensitive).

- `GET /api/erros/marca/:marca`  
  Busca por marca (case-insensitive).

## Frontend

O arquivo `index.html` consome a API em `http://localhost:3000/api/erros`.  
Se você mudar a porta, ajuste a constante `API_BASE_URL` dentro do HTML.

## Estrutura de pastas

- `manuais_pendentes/`: PDFs aguardando processamento
- `textos_brutos/`: textos extraídos das páginas relevantes
- `dados_estruturados/`: JSONs com erros padronizados
- `manuais_concluidos/`: PDFs já processados

## Observações

- O `pipeline.js` cria as pastas automaticamente se não existirem.
- O `populador.js` faz saneamento dos dados e evita campos vazios.
