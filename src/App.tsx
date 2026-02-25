import { SongList } from './components/SongList';
import { PlayerShell } from './components/PlayerShell';
import { usePlayerStore } from './store/usePlayerStore';

function App() {
  const currentSong = usePlayerStore((state) => state.currentSong);

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900">
      <main>
        <PlayerShell />
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <SongList />
        </div>
      </main>

      {/* 底部播放控制栏 */}
      <div className="fixed bottom-0 w-full h-24 bg-white border-t border-gray-200 text-gray-700 flex items-center px-6 justify-between">
        {currentSong ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md border border-gray-300 bg-gray-100" /> {/* 假封面 */}
            <div>
              <p className="font-semibold text-gray-900">{currentSong.title}</p>
              <p className="text-sm text-gray-500">{currentSong.artist}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">请在上方选择一首歌曲...</p>
        )}

        <div className="text-gray-500">播放控制按钮（待添加）</div>
      </div>
    </div>
  );
}

export default App;
