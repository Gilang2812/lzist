import { useState, useEffect } from 'react';
import { calculateHash } from '../utils/hash';
import { INITIAL_DATA } from '../data/restockInitialData';
import { SYNC_HASH_KEY, syncDatabaseWithMaster } from '../utils/initDb';

export const useDataSync = () => {
  const [isOutOfSync, setIsOutOfSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkSync = () => {
    const storedHash = localStorage.getItem(SYNC_HASH_KEY);
    const currentHash = calculateHash(JSON.stringify(INITIAL_DATA));
    
    if (storedHash && storedHash !== currentHash) {
      setIsOutOfSync(true);
    } else {
      setIsOutOfSync(false);
    }
  };

  useEffect(() => {
    // Check initially
    checkSync();

    // Listen to custom event when db syncs
    const handleSync = () => {
      checkSync();
    };

    window.addEventListener('lzist-db-synced', handleSync);
    return () => window.removeEventListener('lzist-db-synced', handleSync);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncDatabaseWithMaster();
    } catch (error) {
      console.error('Error syncing database', error);
    } finally {
      setIsSyncing(false);
      checkSync(); // Re-check to update state
    }
  };

  return { isOutOfSync, isSyncing, handleSync };
};
