import { FC } from 'react';
import { PoolList } from '../utils/poollist';
import { LenderPoolItem } from './LendPoolItem';

export const LenderPoolList: FC = () => {
  return (
    <PoolList
      renderPoolItem={(pool, onTxSuccess) => (
        <LenderPoolItem 
          pool={pool} 
          onTxSuccess={onTxSuccess}
        />
      )}
    />
  );
};