import { PlayerShell } from './components/PlayerShell';

function App() {
  return (
    <div className="app-shell relative overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-32 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
      <main className="relative">
        <PlayerShell />
      </main>
    </div>
  );
}

export default App;
