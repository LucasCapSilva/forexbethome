import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { User } from '../types/User';

export const getUserById = async (uid: string) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as User;
    } else {
      console.log('No such user document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting user document:', error);
    throw error;
  }
};

export const saveUser = async (userData: User) => {
  try {
    // Criar usuário no Firebase Auth
    const authResult = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.senha
    );

    // Remover campos sensíveis antes de salvar no Firestore
    const { senha, confirmarSenha, ...userDataToSave } = userData;

    // Salvar dados do usuário no Firestore
    const userDocData = {
      ...userDataToSave,
      uid: authResult.user.uid,
      dataCadastro: new Date()
    };

    await addDoc(collection(db, 'users'), userDocData);
    return authResult.user;
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Buscar dados adicionais do usuário no Firestore
    const usersCollection = collection(db, 'users');

    const q = query(usersCollection, where('uid', '==', result.user.uid));
    const querySnapshot = await getDocs(q);
        
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
    
      return {
        user: result.user,
        isAdmin: userData.isAdmin || false,
        ...userData // Incluindo todos os dados do usuário no retorno
      };
    }
    
    return {
      user: result.user,
      isAdmin: false,
      uid: result.user.uid,
      email: result.user.email
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as User);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};