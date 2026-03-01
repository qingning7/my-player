import { useEffect, useState } from 'react';
import { createPlaylist, fetchPlaylists, type Playlist } from '../lib/api';
import { usePlayerStore } from '../store/usePlayerStore';

const songs = [
  { id: 1, title: '告白气球', artist: '周杰伦', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: '阳光宅男', artist: '周杰伦', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
];

export const SongList = () => {
  // 从 Store 中拿到“修改当前歌曲”的方法
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadPlaylists = () => {
    let alive = true;
    setLoading(true);
    fetchPlaylists()
      .then((data) => {
        if (alive) {
          setPlaylists(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : '加载失败');
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  };

  useEffect(() => loadPlaylists(), []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setCreateError('歌单名不能为空');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const created = await createPlaylist({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      setPlaylists((prev) => [created, ...prev]);
      setName('');
      setDescription('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '新增失败');
    } finally {
      setCreating(false);
    }
  };

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
                ? 'border-gray-300 bg-gray-100'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-gray-900">{song.title}</p>
            <p className="text-xs text-gray-500">{song.artist}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-base font-semibold text-gray-800">歌单（来自后端）</h3>
        <form onSubmit={handleCreate} className="mb-4 grid gap-2 text-sm">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="歌单名称（必填）"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="歌单描述（可选）"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-fit rounded border border-gray-300 bg-gray-100 px-4 py-2 text-gray-700 disabled:cursor-not-allowed"
          >
            {creating ? '创建中...' : '新增歌单'}
          </button>
          {createError && <p className="text-sm text-red-500">{createError}</p>}
        </form>
        {loading && <p className="text-sm text-gray-500">加载中...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && playlists.length === 0 && (
          <p className="text-sm text-gray-500">暂无歌单</p>
        )}
        {!loading && !error && playlists.length > 0 && (
          <ul className="space-y-2 text-sm text-gray-700">
            {playlists.map((playlist) => (
              <li key={playlist.id} className="rounded border border-gray-200 px-3 py-2">
                <p className="font-medium">{playlist.name}</p>
                {playlist.description && (
                  <p className="text-xs text-gray-500">{playlist.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
