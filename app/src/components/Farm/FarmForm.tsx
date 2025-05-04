import { FC } from 'react';
import { PoolList } from '../utils/poollist';
import { useNavigate } from 'react-router-dom';

export const FarmForm: FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PoolList
        showCreatePool={true}
        onCreatePool={() => navigate('/farm/create')}
      />
    </div>
  );
};