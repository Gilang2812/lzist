import React from 'react';
import { useAppModeStore } from '../stores/useAppModeStore';
import OfflineKatalogView from '../components/katalog/OfflineKatalogView';
import OnlineKatalogView from '../components/katalog/OnlineKatalogView';

const KatalogPage: React.FC = () => {
  const { mode } = useAppModeStore();

  if (mode === 'online') {
    return <OnlineKatalogView />;
  }

  return <OfflineKatalogView />;
};

export default KatalogPage;
