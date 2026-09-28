import React from 'react';
import { TransferState } from '../types';
import { TransferHUD } from './TransferHUD';

interface TransferProgressProps {
  transfers: TransferState[];
}

export const TransferProgress: React.FC<TransferProgressProps> = ({ transfers }) => {
  return <TransferHUD transfers={transfers} />;
};
