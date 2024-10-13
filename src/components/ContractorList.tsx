import React from 'react';
import { Contractor } from '../types';

interface ContractorListProps {
  contractors: Contractor[];
}

const ContractorList: React.FC<ContractorListProps> = ({ contractors }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Contractors</h3>
      {contractors.length === 0 ? (
        <p>No contractors found. Add contractors in the Contractor Management page.</p>
      ) : (
        <ul className="max-h-60 overflow-y-auto">
          {contractors.map((contractor) => (
            <li key={contractor.id} className="flex items-center mb-2 bg-white shadow-sm rounded p-2">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: contractor.color }}
              ></div>
              <span>{contractor.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContractorList;