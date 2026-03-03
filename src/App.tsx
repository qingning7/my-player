import { NavLink, Route, Routes } from 'react-router-dom';
import { PlayerShell } from './components/PlayerShell';
import { PlaylistsPage } from './pages/PlaylistsPage';

const TEXT = {
  brand: '我的播放器',
  player: '播放器',
  playlists: '歌单',
};

function App() {
  return (
    <div className="app-shell relative overflow-hidden">
      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-end px-6 pt-8">
          <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/70 p-1 text-sm text-[color:var(--muted)] shadow-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-3 py-1 transition ${
                  isActive ? 'bg-white text-[color:var(--accent-700)] shadow' : 'hover:bg-white/70'
                }`
              }
            >
              {TEXT.player}
            </NavLink>
            <NavLink
              to="/playlists"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 transition ${
                  isActive ? 'bg-white text-[color:var(--accent-700)] shadow' : 'hover:bg-white/70'
                }`
              }
            >
              {TEXT.playlists}
            </NavLink>
          </div>
        </nav>
      </header>
      <main className="relative">
        <Routes>
          <Route path="/" element={<PlayerShell />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
