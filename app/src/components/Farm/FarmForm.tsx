import { FC, useState } from 'react';
import { PoolList } from '../utils/poollist';
import { PoolItem } from './PoolItem';
import { CreatePoolForm } from './CreatePoolForm';

export const FarmForm: FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (showCreateForm) {
    return (
      <CreatePoolForm 
        onShowForm={setShowCreateForm}
        onSuccess={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <PoolList
      renderPoolItem={(pool) => <PoolItem pool={pool} />}
      showCreatePool={true}
      onCreatePool={() => setShowCreateForm(true)}
    />
  );
};