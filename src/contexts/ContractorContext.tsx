import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Contractor } from '../types';

interface ContractorContextType {
  contractors: Contractor[];
  setContractors: React.Dispatch<React.SetStateAction<Contractor[]>>;
  fetchContractors: () => Promise<void>;
}

const ContractorContext = createContext<ContractorContextType | undefined>(undefined);

export const useContractors = () => {
  const context = useContext(ContractorContext);
  if (!context) {
    throw new Error('useContractors must be used within a ContractorProvider');
  }
  return context;
};

export const ContractorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const { currentUser } = useAuth();

  const fetchContractors = async () => {
    if (currentUser) {
      const userDomain = currentUser.email?.split('@')[1] || '';
      const q = query(collection(db, 'contractors'), where('domain', '==', userDomain));
      const querySnapshot = await getDocs(q);
      const fetchedContractors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contractor));
      setContractors(fetchedContractors);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, [currentUser]);

  return (
    <ContractorContext.Provider value={{ contractors, setContractors, fetchContractors }}>
      {children}
    </ContractorContext.Provider>
  );
};
