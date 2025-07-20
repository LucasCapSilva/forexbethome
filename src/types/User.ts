export interface User {
  id?: string;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: Date;
  nacionalidade: string;
  genero: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar';
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  dataCadastro?: Date;
  isAdmin?: boolean;
  senha: string;
  confirmarSenha: string;
  rg: string;
  documents?: {
    addressProof: string;
    rgBack: string;
    rgFront: string;
  };
}