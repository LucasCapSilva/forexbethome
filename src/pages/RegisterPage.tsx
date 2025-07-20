import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import InputMask from 'react-input-mask';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../services/userService';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Definindo o schema do usuário
const userSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .refine((cpf) => validarCPFComMensagem(cpf).valido, {
      message: 'CPF inválido'
    }),
  dataNascimento: z.string().min(1, 'Data obrigatória')
    .transform((date) => {
      const [day, month, year] = date.split('/');
      return new Date(Number(year), Number(month) - 1, Number(day));
    }),
  nacionalidade: z.string().min(1, 'Selecione uma opção'),
  genero: z.enum(['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'], {
    errorMap: () => ({ message: 'Selecione uma opção válida' })
  }),
  telefone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido'),
  rg: z.string().regex(/^\d{2}\.\d{3}\.\d{3}-\d{1}$/, 'RG deve estar no formato XX.XXX.XXX-X'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  logradouro: z.string().min(3, 'Mínimo 3 caracteres'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(3, 'Mínimo 3 caracteres'),
  cidade: z.string().min(3, 'Mínimo 3 caracteres'),
  estado: z.string().length(2, 'UF inválida')
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não conferem',
  path: ['confirmarSenha']
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [rgFrontFile, setRgFrontFile] = useState<File | null>(null);
  const [rgBackFile, setRgBackFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [rgFrontPreview, setRgFrontPreview] = useState<string | null>(null);
  const [rgBackPreview, setRgBackPreview] = useState<string | null>(null);
  const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm({
    resolver: zodResolver(userSchema)
  });

  // Cleanup dos object URLs
  useEffect(() => {
    return () => {
      if (rgFrontPreview) URL.revokeObjectURL(rgFrontPreview);
      if (rgBackPreview) URL.revokeObjectURL(rgBackPreview);
      if (addressProofPreview) URL.revokeObjectURL(addressProofPreview);
    };
  }, [rgFrontPreview, rgBackPreview, addressProofPreview]);

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/[^0-9]/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setValue('logradouro', data.logradouro);
      setValue('bairro', data.bairro);
      setValue('cidade', data.localidade);
      setValue('estado', data.uf);
    } catch (error) {
      toast.error('Erro ao buscar CEP');
      console.error(error);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    if (!file) return null;
    
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Upload documents
      const [rgFrontUrl, rgBackUrl, addressProofUrl] = await Promise.all([
        uploadFile(rgFrontFile!, `documents/${data.cpf}/rg_front`),
        uploadFile(rgBackFile!, `documents/${data.cpf}/rg_back`),
        uploadFile(addressProofFile!, `documents/${data.cpf}/address_proof`)
      ]);

      const { confirmarSenha, ...userData } = data;
      
      await saveUser({ 
        ...userData, 
        isAdmin: false,
        documents: {
          rgFront: rgFrontUrl,
          rgBack: rgBackUrl,
          addressProof: addressProofUrl
        }
      }); 
      
      toast.success('Cadastro realizado com sucesso!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar usuário. Tente novamente.');
      console.error('Erro no cadastro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    //Validaçao
    // Validação para cada step antes de avançar
    let isValid = false;
    
    switch (currentStep) {
      case 1: // Validação do step 1 (credenciais)
        isValid = await trigger(['email', 'senha', 'confirmarSenha']);
        if (isValid) {
          setCurrentStep(2);
        }
        break;
        
      case 2: // Validação do step 2 (informações pessoais)
        isValid = await trigger(['nome', 'cpf', 'rg', 'telefone', 'dataNascimento', 'nacionalidade', 'genero']);
        if (isValid) {
          setCurrentStep(3);
        }
        break;
        
      case 3: // Validação do step 3 (endereço)
        isValid = await trigger(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado']);
        if (isValid) {
          setCurrentStep(4);
        }
        break;
        
      default:
        break;
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] || null;
    setFile(file);
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  };

  const areDocumentsUploaded = rgFrontFile && rgBackFile && addressProofFile;

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6 md:mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-sm md:text-base ${currentStep === step ? 'bg-[#49A1F2] text-white' : currentStep > step ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 4 && (
                <div className={`w-8 md:w-12 h-1 ${currentStep > step ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderStepTitle = () => {
    const titles = {
      1: 'Vamos começar!\nPreencha com as suas informações',
      2: 'Olá!\nQueremos saber mais sobre você',
      3: 'Agora precisamos do seu endereço',
      4: 'Documentos necessários'
    };
    return (
      <div className="text-center mb-6 md:mb-8">
        {titles[currentStep].split('\n').map((line, i) => (
          <div key={i} className={i === 0 ? 'text-xl md:text-2xl font-bold text-white mb-1 md:mb-2' : 'text-base md:text-lg text-gray-300'}>{line}</div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: // STEP 1: Credenciais
        return (
          <div className="space-y-3 md:space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">Email</label>
              <input
                {...register('email')}
                placeholder="Email"
                className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
              />
              {errors.email && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-white mb-1">Senha</label>
              <input
                type="password"
                {...register('senha')}
                placeholder="Senha"
                className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
              />
              {errors.senha && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.senha.message}</p>}
            </div>
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-white mb-1">Confirmar Senha</label>
              <input
                type="password"
                {...register('confirmarSenha')}
                placeholder="Confirmar Senha"
                className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
              />
              {errors.confirmarSenha && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.confirmarSenha.message}</p>}
            </div>
          </div>
        );
      case 2: // STEP 2: Informações pessoais
        return (
          <div className="space-y-3 md:space-y-4">
            <div key="step2">
              <input
                {...register('nome')}
                key="nomeInput"
                placeholder="Nome completo"
                className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
              />
              {errors.nome && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-white mb-1">CPF</label>
                <InputMask
                  mask="999.999.999-99"
                  {...register('cpf')}
                  placeholder="CPF"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.cpf && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.cpf.message}</p>}
              </div>
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-white mb-1">RG</label>
                <InputMask
                  mask="99.999.999-9"
                  {...register('rg')}
                  placeholder="RG"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.rg && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.rg.message}</p>}
              </div>
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-white mb-1">Telefone</label>
                <InputMask
                  mask="(99) 99999-9999"
                  {...register('telefone')}
                  placeholder="Telefone"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.telefone && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.telefone.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label htmlFor="dataNascimento" className="block text-sm font-medium text-white mb-1">Data de Nascimento</label>
                <InputMask
                  mask="99/99/9999"
                  {...register('dataNascimento')}
                  placeholder="DD/MM/AAAA"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.dataNascimento && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.dataNascimento.message}</p>}
              </div>
              <div>
                <label htmlFor="nacionalidade" className="block text-sm font-medium text-white mb-1">Nacionalidade</label>
                <select
                  {...register('nacionalidade')}
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                >
                  <option value="">Selecione</option>
                  <option value="Brasileira">Brasileira</option>
                  <option value="Estrangeira">Estrangeira</option>
                </select>
                {errors.nacionalidade && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.nacionalidade.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="genero" className="block text-sm font-medium text-white mb-1">Gênero</label>
              <select
                {...register('genero')}
                className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
              >
                <option value="">Selecione o gênero</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
              {errors.genero && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.genero.message}</p>}
            </div>
          </div>
        );
      case 3: // STEP 3: Endereço
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="cep" className="block text-sm font-medium text-white mb-1">CEP</label>
              <InputMask
                mask="99999-999"
                {...register('cep')}
                placeholder="CEP"
                className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                onBlur={(e) => handleCepSearch(e.target.value)}
              />
              {errors.cep && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.cep.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label htmlFor="logradouro" className="block text-sm font-medium text-white mb-1">Logradouro</label>
                <input
                  {...register('logradouro')}
                  placeholder="Logradouro"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.logradouro && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.logradouro.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label htmlFor="numero" className="block text-sm font-medium text-white mb-1">Número</label>
                  <input
                    {...register('numero')}
                    placeholder="Número"
                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                  />
                  {errors.numero && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.numero.message}</p>}
                </div>
                <div>
                  <label htmlFor="complemento" className="block text-sm font-medium text-white mb-1">Complemento</label>
                  <input
                    {...register('complemento')}
                    placeholder="Complemento"
                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label htmlFor="bairro" className="block text-sm font-medium text-white mb-1">Bairro</label>
                <input
                  {...register('bairro')}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.bairro && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.bairro.message}</p>}
              </div>
              <div>
                <label htmlFor="cidade" className="block text-sm font-medium text-white mb-1">Cidade</label>
                <input
                  {...register('cidade')}
                  placeholder="Cidade"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.cidade && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.cidade.message}</p>}
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-white mb-1">Estado (UF)</label>
                <input
                  {...register('estado')}
                  placeholder="UF"
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-[#000000] text-white border border-[#49A1F2] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#49A1F2] text-sm md:text-base"
                />
                {errors.estado && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.estado.message}</p>}
              </div>
            </div>
          </div>
        );
      case 4: // STEP 4: Documentos
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Frente do RG</label>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#49A1F2] border-dashed rounded-lg cursor-pointer bg-[#000000] hover:bg-[#0a1426] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-[#49A1F2]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-[#49A1F2]"><span className="font-semibold">Clique para enviar</span></p>
                      <p className="text-xs text-gray-400">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setRgFrontFile, setRgFrontPreview)}
                      className="hidden"
                    />
                  </label>
                  {rgFrontPreview && (
                    <div className="mt-2 border border-[#49A1F2] rounded-md p-1">
                      <img 
                        src={rgFrontPreview} 
                        alt="Frente do RG" 
                        className="w-full h-32 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Verso do RG</label>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#49A1F2] border-dashed rounded-lg cursor-pointer bg-[#000000] hover:bg-[#0a1426] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-[#49A1F2]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-[#49A1F2]"><span className="font-semibold">Clique para enviar</span></p>
                      <p className="text-xs text-gray-400">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setRgBackFile, setRgBackPreview)}
                      className="hidden"
                    />
                  </label>
                  {rgBackPreview && (
                    <div className="mt-2 border border-[#49A1F2] rounded-md p-1">
                      <img 
                        src={rgBackPreview} 
                        alt="Verso do RG" 
                        className="w-full h-32 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Comprovante de Endereço</label>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#49A1F2] border-dashed rounded-lg cursor-pointer bg-[#000000] hover:bg-[#0a1426] transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-[#49A1F2]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-[#49A1F2]"><span className="font-semibold">Clique para enviar</span></p>
                    <p className="text-xs text-gray-400">PNG, JPG (MAX. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setAddressProofFile, setAddressProofPreview)}
                    className="hidden"
                  />
                </label>
                {addressProofPreview && (
                  <div className="mt-2 border border-[#49A1F2] rounded-md p-1">
                    <img 
                      src={addressProofPreview} 
                      alt="Comprovante de Endereço" 
                      className="w-full h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-300 mt-4">
              <p>Formatos aceitos: JPG, PNG (máx. 5MB cada)</p>
              <p className="mt-1">Documentos devem estar legíveis e com dados visíveis</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#12213E] to-[#000000] p-4">
      <div 
        className="w-full max-w-md md:max-w-2xl lg:max-w-4xl shadow-2xl rounded-xl md:rounded-2xl border border-[#49A1F2] overflow-hidden"
        style={{ backgroundColor: 'rgba(6, 40, 75, 0.8)' }}
      >
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex justify-center mb-6 md:mb-8">
            <img 
              src="https://forexbet.com.br/wp-content/uploads/2025/04/LOGO-FOREX-BET-2-1024x172.png" 
              alt="ForexBet Logo"
              className="w-full max-w-xs"
            />
          </div>
          
          {renderStepIndicator()}
          {renderStepTitle()}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            {renderStep()}
            
            <div className="flex justify-between pt-4 md:pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 md:px-6 md:py-3 border border-[#49A1F2] text-[#49A1F2] rounded-md hover:bg-[#49A1F2] hover:text-white transition-colors duration-300 text-sm md:text-base"
                >
                  Voltar
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-4 py-2 md:px-6 md:py-3 bg-[#49A1F2] text-white rounded-md hover:bg-[#3a89d6] transition-colors duration-300 text-sm md:text-base"
                >
                  Próxima
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !areDocumentsUploaded}
                  className={`ml-auto px-4 py-2 md:px-6 md:py-3 ${
                    isSubmitting || !areDocumentsUploaded ? 'bg-[#49a1f280]' : 'bg-[#49A1F2]'
                  } text-white rounded-md transition-colors duration-300 text-sm md:text-base
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-3 md:mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#49A1F2] hover:text-[#3a89d6] transition-colors text-sm md:text-base"
            >
              Já tem uma conta? Faça login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const validarCPFComMensagem = (cpf: string): { valido: boolean; mensagem: string } => {
  const cpfLimpo = cpf.replace(/[^\d]/g, '');

  if (!cpfLimpo) {
    return { valido: false, mensagem: 'CPF é obrigatório' };
  }

  if (cpfLimpo.length !== 11) {
    return { valido: false, mensagem: 'CPF deve conter 11 dígitos' };
  }

  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, mensagem: 'CPF inválido: todos os números são iguais' };
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto > 9 ? 0 : resto;
  if (digitoVerificador1 !== parseInt(cpfLimpo.charAt(9))) {
    return { valido: false, mensagem: 'CPF inválido: primeiro dígito verificador incorreto' };
  }

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto > 9 ? 0 : resto;
  if (digitoVerificador2 !== parseInt(cpfLimpo.charAt(10))) {
    return { valido: false, mensagem: 'CPF inválido: segundo dígito verificador incorreto' };
  }

  return { valido: true, mensagem: '' };
};