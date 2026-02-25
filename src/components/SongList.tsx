import { usePlayerStore } from '../store/usePlayerStore';

const songs = [
  { id: 1, title: '告白气球', artist: '周杰伦', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: '阳光宅男', artist: '周杰伦', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
];

export const SongList = () => {
  // 从 Store 中拿到“修改当前歌曲”的方法
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const currentSong = usePlayerStore((state) => state.currentSong);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">推荐歌曲</h2>
      <div className="grid gap-3">
        {songs.map((song) => (
          <div
            key={song.id}
            onClick={() => setCurrentSong(song)} // 点击切换歌曲
            className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors ${
              currentSong?.id === song.id
                ? 'border-gray-300 bg-gray-100' // 正在播放的样式
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-gray-900">{song.title}</p>
            <p className="text-xs text-gray-500">{song.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
