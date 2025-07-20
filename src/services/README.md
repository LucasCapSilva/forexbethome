# Camada de Serviço MT5 API

Esta documentação descreve como usar a camada de serviço para integração com a API MT5.

## 📁 Estrutura dos Arquivos

```
src/
├── types/
│   └── mt5.ts              # Tipos TypeScript para MT5
├── services/
│   ├── mt5Service.ts       # Classe principal do serviço
│   ├── mt5Config.ts        # Configuração e inicialização
│   └── README.md           # Esta documentação
├── hooks/
│   └── useMT5Service.ts    # Hook React para uso em componentes
└── components/
    └── MT5Dashboard.tsx    # Componente de exemplo
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# Configurações da API MT5
VITE_MT5_API_BASE_URL=http://45.166.15.28
VITE_MT5_API_PORT=8488
VITE_MT5_API_KEY=b8f3e65a2d9c4f1e7a8b0c3d5f6e2a1b
VITE_MT5_API_ENDPOINT=/receive_data.php
```

### Inicialização

```typescript
import { initializeMT5Service } from './services/mt5Config';

// Inicializar o serviço (fazer uma vez na aplicação)
const mt5Service = initializeMT5Service();
```

## 🚀 Uso Básico

### 1. Usando o Hook (Recomendado)

```typescript
import React from 'react';
import { useMT5Service } from '../hooks/useMT5Service';
import { MT5Data } from '../types/mt5';

const MyComponent: React.FC = () => {
  const { sendData, testConnection, isLoading, error, isConnected } = useMT5Service();

  const handleSendData = async () => {
    const data: MT5Data = {
      account_number: 123456,
      open_positions_summary: {
        count: 2,
        total_profit: 150.75,
        total_volume: 1.50
      },
      positions: [
        {
          ticket: 12345,
          symbol: "EURUSD",
          type: "buy",
          volume: 1.0,
          price_open: 1.0850,
          profit: 75.50,
          magic: 202401
        }
      ],
      history: []
    };

    const response = await sendData(data);
    if (response) {
      console.log('Sucesso:', response.status);
    }
  };

  return (
    <div>
      <button onClick={handleSendData} disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar Dados'}
      </button>
      
      <button onClick={testConnection}>
        Testar Conexão
      </button>
      
      {error && <p style={{color: 'red'}}>Erro: {error}</p>}
      {isConnected && <p style={{color: 'green'}}>✅ Conectado</p>}
    </div>
  );
};
```

### 2. Uso Direto do Serviço

```typescript
import { getMT5Service } from '../services/mt5Service';
import { MT5Data } from '../types/mt5';

const sendTradingData = async (data: MT5Data) => {
  const service = getMT5Service();
  if (!service) {
    console.error('Serviço MT5 não inicializado');
    return;
  }

  try {
    const response = await service.sendTradingData(data);
    console.log('Resposta:', response);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

## 📊 Estrutura dos Dados

### Dados de Entrada (MT5Data)

```typescript
interface MT5Data {
  account_number: number;
  open_positions_summary: {
    count: number;
    total_profit: number;
    total_volume: number;
  };
  positions: Position[];
  history: HistoryPosition[];
}

interface Position {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  price_open: number;
  profit: number;
  magic: number;
}

interface HistoryPosition {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  price: number;
  profit: number;
  time: number;  // Unix timestamp
  magic: number;
}
```

### Resposta da API

```typescript
interface MT5ApiResponse {
  status: string;  // "sucesso"
}
```

## 🔍 Exemplo Completo

```typescript
const exampleData: MT5Data = {
  account_number: 123456,
  open_positions_summary: {
    count: 3,
    total_profit: 100.50,
    total_volume: 1.20
  },
  positions: [
    {
      ticket: 12345,
      symbol: "XAUUSD",
      type: "buy",
      volume: 0.50,
      price_open: 2314.20,
      profit: 40.10,
      magic: 202401
    },
    {
      ticket: 12346,
      symbol: "EURUSD",
      type: "sell",
      volume: 0.30,
      price_open: 1.0850,
      profit: 25.20,
      magic: 202401
    }
  ],
  history: [
    {
      ticket: 12221,
      symbol: "XAUUSD",
      type: "sell",
      volume: 0.20,
      price: 2312.00,
      profit: -5.10,
      time: 1720700000,
      magic: 202401
    }
  ]
};
```

## 🛠️ Funcionalidades

### ✅ Implementadas

- ✅ Configuração via variáveis de ambiente
- ✅ Validação de configuração
- ✅ Serviço singleton com Axios
- ✅ Interceptors para logs
- ✅ Hook React personalizado
- ✅ Tratamento de erros
- ✅ Teste de conectividade
- ✅ Tipos TypeScript completos
- ✅ Componente de exemplo/dashboard

### 🔄 Recursos Avançados

- **Retry automático**: Implementar retry em caso de falha
- **Cache de respostas**: Cache temporário para evitar requisições duplicadas
- **Métricas**: Coleta de métricas de performance
- **Websockets**: Implementar conexão em tempo real

## 🚨 Tratamento de Erros

O serviço trata os seguintes tipos de erro:

- **Configuração inválida**: Variáveis de ambiente ausentes
- **Erro de rede**: Timeout, conexão recusada
- **Erro HTTP**: Status codes diferentes de 200
- **Erro de parsing**: Resposta JSON inválida

## 📝 Logs

Em modo de desenvolvimento, o serviço registra:

- 🚀 Requisições enviadas
- ✅ Respostas recebidas
- ❌ Erros ocorridos
- 🔧 Configuração atual

## 🔒 Segurança

- API Key é enviada via query string (conforme especificação)
- Logs não expõem a API Key completa
- Configuração pode ser validada sem expor credenciais

## 📞 Suporte

Para dúvidas técnicas:
**Felipe Braga - 2024**
[https://forexdreamvantage.com](https://forexdreamvantage.com)