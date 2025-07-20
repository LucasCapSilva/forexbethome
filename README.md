## Modelo de Dados
### Entidade Trade
A entidade Trade representa uma operação de trading com os seguintes atributos:
- id (Integer, obrigatório): Identificador único
- accountNumber (Long, obrigatório): Número da conta
- ticket (Long, obrigatório): Número do ticket
- magic (Long): Magic number
- symbol (String, obrigatório): Símbolo do ativo
- type (TradeType, obrigatório): Tipo da operação (buy/sell)
- volume (BigDecimal, obrigatório): Volume da operação
- priceOpen (BigDecimal, obrigatório): Preço de abertura
Documentação da API MT5 Trades
- price (BigDecimal): Preço atual
- profit (BigDecimal): Lucro/Prejuízo
- t (LocalDateTime): Timestamp
- isHistory (Boolean): Histórico
- comment (String): Comentário
- openTime (LocalDateTime): Horário de abertura
- createdAt (LocalDateTime, obrigatório): Data de criação
### Enum TradeType
- buy - Operação de compra
- sell - Operação de venda
## Endpoints da API
Base URL: http://45.166.15.28:8093/api/trades
### CRUD:
- POST /api/trades - Criar Trade
- GET /api/trades - Buscar Todos os Trades
- GET /api/trades/{id} - Buscar por ID
- GET /api/trades/ticket/{ticket} - Buscar por Ticket
- GET /api/trades/account/{accountNumber} - Buscar por Conta
- GET /api/trades/symbol/{symbol} - Buscar por Símbolo
- GET /api/trades/type/{type} - Buscar por Tipo
- GET /api/trades/history/{isHistory} - Buscar por Histórico
- GET /api/trades/magic/{magic} - Buscar por Magic Number
- GET /api/trades/period?startDate={start}&endDate={end} - Por Período
- GET /api/trades/account/{accountNumber}/paginated - Com Paginação
- PUT /api/trades/{id} - Atualizar Trade
- DELETE /api/trades/{id} - Deletar Trade
- DELETE /api/trades - Deletar Todos
Documentação da API MT5 Trades
## Status HTTP
- 200 OK
- 201 Created
- 204 No Content
- 404 Not Found
- 500 Internal Server Error
## Execução com Docker Compose
1. Clonar o repositório
2. Executar a aplicação
3. Verificar status
4. Acessar logs
## Execução com Maven
1. Compilar
2. Executar
## Validações
- accountNumber: obrigatório
- ticket: obrigatório e único
- symbol: obrigatório (máx. 16)
- type: obrigatório (buy/sell)
- volume: obrigatório
- priceOpen: obrigatório
- comment: opcional (máx. 255)
## Logs e Segurança
- SQL log no console
- Debug para Hibernate
- CORS liberado para dev
- Validação de entrada e tratamento de exceções
Documentação da API MT5 Trades
## Exemplos com cURL / Insomnia
Base: http://45.166.15.28:8093/api/trades
GET -> Testa conexão
POST -> Cria Trade
GET ID -> Busca por ID
PUT -> Atualiza Trade
DELETE -> Remove Trade
## Troubleshooting
- Verificar conexão e credenciais
- Alterar porta se em uso
- Verificar campos obrigatórios e formatos