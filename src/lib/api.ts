const API_BASE = 'http://localhost:3000';

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  trackIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  trackIds?: string[];
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string | null;
  trackIds?: string[];
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
    throw new Error('创建歌单失败');
  }
  return res.json();
}

export async function updatePlaylist(
  id: string,
  input: UpdatePlaylistInput,
): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error('更新歌单失败');
  }
  return res.json();
}

export async function deletePlaylist(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/playlists/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('删除歌单失败');
  }
}
