import React from 'react';
import { useAppModeStore } from '../stores/useAppModeStore';
import OfflineRestockListView from '../components/restock/OfflineRestockListView';
import OnlineRestockListView from '../components/restock/OnlineRestockListView';

const RestockListPage: React.FC = () => {
  const { mode } = useAppModeStore();

  if (mode === 'online') {
    return <OnlineRestockListView />;
  }

  return <OfflineRestockListView />;
};

export default RestockListPage;
