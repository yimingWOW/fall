import { FC } from 'react';
import { PoolList } from '../utils/poollist';
import { Outlet } from 'react-router-dom';

export const BorrowerPoolList: FC = () => {
  return (
    <div>
      <PoolList />
      <Outlet />  
    </div>
  );
}; 