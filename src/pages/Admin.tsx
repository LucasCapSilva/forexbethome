import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/userService';
import { User } from '../types/User';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [showCPF, setShowCPF] = useState<{[key: string]: boolean}>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');


  
  // Funções para abrir/fechar modal
  const openModal = (imageUrl: string) => {
    setModalImage(imageUrl);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setModalImage('');
  };


  useEffect(() => {

    console.log('user: ', user)

    if (loading) return; // Aguarda o carregamento do estado de autenticação
    
    if (!isAdmin) {
      navigate('/home');
    } else {
      const fetchUsers = async () => {
        try {
          const data = await getUsers();
          setUsers(data);
        } catch (error) {
          console.error('Erro ao buscar usuários:', error);
        }
      };
      fetchUsers();
    }
  }, [isAdmin, loading, navigate]);

  const toggleCPF = (userId: string) => {
    setShowCPF(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const formatCPF = (cpf: string | undefined, show: boolean) => {
    if (!cpf) return '***.***.***-**';
    return show ? cpf : cpf.replace(/\d/g, '*');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#12213E] to-[#000000] text-white p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header com transparência e logo */}
        <header 
          className="shadow-2xl border border-[#49A1F2] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ backgroundColor: 'rgba(6, 40, 75, 0.8)' }}
        >
          <div className="flex items-center">
            <img 
              src="https://forexbet.com.br/wp-content/uploads/2025/04/LOGO-FOREX-BET-2-1024x172.png" 
              alt="ForexBet Logo"
              className="h-8 sm:h-10 md:h-12"
            />
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 sm:w-9 sm:h-9" />
              <p className="font-semibold text-xs sm:text-sm">Administrador</p>
            </div>
          </div>
        </header>

        {/* Container principal com transparência */}
        <div 
          className="shadow-2xl border border-[#49A1F2] rounded-2xl shadow-xl overflow-hidden"
          style={{ backgroundColor: 'rgba(6, 40, 75, 0.8)' }}
        >
          {/* Cabeçalho da tabela com transparência */}
          <div 
            className="p-3 sm:p-4 border-b border-[#49A1F2]"
            style={{ backgroundColor: 'rgba(6, 40, 75, 0.8)' }}
          >
            <h2 className="text-base sm:text-lg font-bold">Usuários Cadastrados</h2>
            <p className="text-gray-400 text-xs mt-1">Gerencie todos os usuários do sistema</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ backgroundColor: 'rgba(6, 40, 75, 0.8)' }}>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Nome</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Email</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">CPF</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">RG</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Data Nasc.</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Nacionalidade</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Gênero</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Telefone</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Endereço</th>
                  <th className="py-2 px-1 sm:py-2 sm:px-2 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 uppercase">Documentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2d5e]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[#06284B] transition-colors">
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm">
                      <div className="min-w-[60px] max-w-[80px] sm:max-w-[120px] truncate">
                        {user.nome}
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[#49A1F2] text-[10px] xs:text-xs sm:text-sm">
                      <div className="min-w-[80px] max-w-[100px] sm:max-w-[150px] truncate">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm">
                      <div className="flex items-center gap-1 min-w-[90px]">
                        <span>{
                          //@ts-ignore
                          formatCPF(user.cpf, showCPF[user.id] || false)
                        }</span>
                        <button
                          onClick={
                            //@ts-ignore
                            () => toggleCPF(user.id)
                          }
                          className="text-[#49A1F2] hover:text-[#3a89d6] text-[10px] xs:text-xs"
                        >
                          {
                            //@ts-ignore
                            showCPF[user.id] ? 'Ocultar' : 'Mostrar'
                          }
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[70px]">{user.rg}</td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[70px]">{
                      //@ts-ignore
                      user.dataNascimento && typeof user.dataNascimento.toDate === 'function' ? user.dataNascimento.toDate().toLocaleDateString() : (user.dataNascimento ? String(user.dataNascimento).split('T')[0] : '')
                    }</td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[80px]">
                      <div className="truncate max-w-[80px]">
                        {user.nacionalidade}
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[60px]">
                      {user.genero}
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[80px]">
                      {user.telefone}
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[120px]">
                      <div className="max-w-[150px]">
                        <div className="truncate">
                          {user.logradouro && user.numero ? `${user.logradouro}, ${user.numero}` : ''}
                          {user.complemento && ` - ${user.complemento}`}
                        </div>
                        <div className="truncate">
                          {user.bairro && user.cidade && user.estado ? `${user.bairro}, ${user.cidade} - ${user.estado}` : ''}
                        </div>
                        <div>
                          {user.cep && `CEP: ${user.cep}`}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:py-2 sm:px-2 text-[10px] xs:text-xs sm:text-sm min-w-[120px]">
                      <div className="flex flex-col space-y-1">
                        {user.documents?.rgFront && (
                          <button
                            onClick={() => {
                              //@ts-ignore
                              openModal(user.documents.rgFront)
                            }}
                            className="bg-[#49A1F2] hover:bg-[#3a89d6] text-white px-2 py-1 rounded text-xs"
                          >
                            RG Frente
                          </button>
                        )}
                        {user.documents?.rgBack && (
                          <button
                            onClick={() => {
                              //@ts-ignore
                              openModal(user.documents.rgBack)
                            }}
                            className="bg-[#49A1F2] hover:bg-[#3a89d6] text-white px-2 py-1 rounded text-xs"
                          >
                            RG Verso
                          </button>
                        )}
                        {user.documents?.addressProof && (
                          <button
                            onClick={() => {
                              //@ts-ignore
                              openModal(user.documents.addressProof)
                            }}
                            className="bg-[#49A1F2] hover:bg-[#3a89d6] text-white px-2 py-1 rounded text-xs"
                          >
                            Comp. Endereço
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 text-center text-gray-400 text-xs">
          © {new Date().getFullYear()} ForexBet. Todos os direitos reservados.
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 text-sm w-8 h-8 flex items-center justify-center"
            >
              X
            </button>
            <img src={modalImage} alt="Document" className="max-w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  );
}