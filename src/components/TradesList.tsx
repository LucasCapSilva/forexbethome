import React from 'react';
import { TradeResponse } from '../types/Trade';

interface TradesListProps {
  trades: TradeResponse[];
  loading: boolean;
  error: string | null;
}

export const TradesList: React.FC<TradesListProps> = ({ trades, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-[#06284B] rounded-lg p-6 shadow-xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#49A1F2]"></div>
          <span className="ml-2 text-gray-400">Carregando trades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#06284B] rounded-lg p-6 shadow-xl border border-red-500/30">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-400 text-sm">Erro ao carregar trades</p>
          <p className="text-gray-500 text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-[#06284B] rounded-lg p-6 shadow-xl">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-400 text-sm">Nenhum trade encontrado</p>
          <p className="text-gray-500 text-xs mt-1">Comece investindo agora!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#06284B] rounded-lg p-6 shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
        📈 Histórico de Trades
        <span className="text-sm bg-[#49A1F2] text-white px-2 py-1 rounded-full">
          {trades.length}
        </span>
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {trades.map((trade) => (
          <div 
            key={trade.id} 
            className="bg-[#0A3A5C] rounded-lg p-4 border border-gray-700 hover:border-[#49A1F2] transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#49A1F2] text-white px-2 py-1 rounded-full font-medium">
                  #{trade.ticket}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">
                  {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {trade.createdAt ? new Date(trade.createdAt).toLocaleTimeString('pt-BR') : ''}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs block">Símbolo</span>
                <span className="text-white font-semibold">{trade.symbol}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Volume</span>
                <span className="text-white font-semibold">{trade.volume.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Preço Abertura</span>
                <span className="text-white font-semibold">{trade.priceOpen.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Preço Atual</span>
                <span className="text-white font-semibold">
                  {trade.price ? trade.price.toFixed(4) : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Lucro/Prejuízo</span>
                <div className={`font-semibold flex items-center gap-1 ${
                  (trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span>{(trade.profit || 0) >= 0 ? '📈' : '📉'}</span>
                  <span>
                    {(trade.profit || 0) >= 0 ? '+' : ''}
                    {(trade.profit || 0).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </span>
                </div>
              </div>
              
              {trade.comment && (
                <div className="mt-2">
                  <span className="text-gray-400 text-xs block">Comentário</span>
                  <span className="text-gray-300 text-xs">{trade.comment}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradesList;