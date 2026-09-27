import React from 'react';
import { useAppModeStore } from '../stores/useAppModeStore';
import OfflineRestockDetailView from '../components/restock/OfflineRestockDetailView';
import OnlineRestockDetailView from '../components/restock/OnlineRestockDetailView';

const RestockDetailPage: React.FC = () => {
  const { mode } = useAppModeStore();

  if (mode === 'online') {
    return <OnlineRestockDetailView />;
  }

  return <OfflineRestockDetailView />;
};

export default RestockDetailPage;
