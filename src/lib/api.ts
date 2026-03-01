const API_BASE = 'http://localhost:3000';

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch(`${API_BASE}/playlists`);
  if (!res.ok) {
    throw new Error('获取歌单失败');
  }
  return res.json();
}

export async function createPlaylist(input: CreatePlaylistInput): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error('新增歌单失败');
  }
  return res.json();
}
