import { FC } from 'react';
import { PoolList } from '../utils/poollist';
import { Outlet } from 'react-router-dom';

export const LenderPoolList: FC = () => {
  return (
    <div>
      <PoolList />
      <Outlet />  {/* 这里会渲染子路由（LenderPoolItem）*/}
    </div>
  );
};