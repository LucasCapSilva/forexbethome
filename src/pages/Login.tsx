import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser } from '../services/userService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres')
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setIsAdmin } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginData) => {
    try {
      const result = await loginUser(data.email, data.senha);
      
      // Atualiza o contexto com os dados do usuário
      setUser(result.user);
      setIsAdmin(result.isAdmin);

      toast.success('Login realizado com sucesso!');

      if (result.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      console.error('Erro no login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#12213E] to-[#000000]">
      <div 
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl border border-[#49A1F2]"
        style={{ backgroundColor: 'rgba(6, 40, 75, 0.8)' }}
      >
        {/* Logo ForexBet */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <img 
            src="https://forexbet.com.br/wp-content/uploads/2025/04/LOGO-FOREX-BET-2-1024x172.png" 
            alt="ForexBet Logo"
            className="w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px]"
          />
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-4 py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2]"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-white">Senha</label>
            <input
              {...register('senha')}
              type="password"
              className="mt-1 block w-full px-4 py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2]"
            />
            {errors.senha && <p className="mt-1 text-sm text-red-500">{errors.senha.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-lg text-lg font-bold text-white bg-[#49A1F2] hover:bg-[#3a89d6] transition-colors duration-300"
          >
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
