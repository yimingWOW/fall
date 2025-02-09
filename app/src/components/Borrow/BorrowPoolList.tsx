import { FC } from 'react';
import { PoolList } from '../utils/poollist';
import { BorrowerPoolItem } from './BorrowPoolItem';

export const BorrowerPoolList: FC = () => {
  return (
    <PoolList
      renderPoolItem={(pool, onTxSuccess) => (
        <BorrowerPoolItem 
          pool={pool} 
          onTxSuccess={onTxSuccess}
        />
      )}
    />
  );
}; 