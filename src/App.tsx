import { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StatusBar } from './components/StatusBar';
import { UpgradePanel } from './components/UpgradePanel';
import { BALANCE } from './data/balance';
import { useGameStore } from './store/useGameStore';
import './styles.css';

export default function App() {
  useEffect(() => {
    const store = useGameStore.getState();
    store.loadGame();

    const incomeTimer = window.setInterval(() => {
      useGameStore.getState().refreshIncomeRate();
    }, 1_000);
    const saveTimer = window.setInterval(() => {
      useGameStore.getState().saveGame();
    }, BALANCE.autoSaveMs);
    const saveBeforeExit = () => useGameStore.getState().saveGame();

    window.addEventListener('beforeunload', saveBeforeExit);
    return () => {
      window.clearInterval(incomeTimer);
      window.clearInterval(saveTimer);
      window.removeEventListener('beforeunload', saveBeforeExit);
      saveBeforeExit();
    };
  }, []);

  return (
    <div className="app-shell">
      <StatusBar />
      <main className="workspace">
        <UpgradePanel />
        <GameCanvas />
      </main>
      <footer className="save-note">Auto-save active / every 10 seconds</footer>
    </div>
  );
}
