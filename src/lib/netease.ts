export type NeteaseTrack = {
  id: number;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
};

export type LyricLine = {
  time: number;
  text: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

type SearchSong = {
  id: number;
  name: string;
  artists?: { name: string }[];
  ar?: { name: string }[];
  album?: { name: string; picUrl?: string };
  al?: { name: string; picUrl?: string };
};

type SearchResponse = {
  code: number;
  result?: {
    songs?: SearchSong[];
  };
};

export async function searchSongs(keyword: string, limit = 12): Promise<NeteaseTrack[]> {
  const url = new URL('/netease/search', API_BASE);
  url.searchParams.set('keywords', keyword);
  url.searchParams.set('type', '1');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Search failed');
  }
  const data = (await res.json()) as SearchResponse;
  const songs = data.result?.songs ?? [];
  return songs.map((song) => {
    const artists = song.artists ?? song.ar ?? [];
    const album = song.album ?? song.al;
    return {
      id: song.id,
      title: song.name,
      artist: artists.map((item) => item.name).join(' / ') || 'Unknown',
      album: album?.name,
      coverUrl: album?.picUrl,
    };
  });
}

type SongUrlResponse = {
  data?: { id: number; url: string | null }[];
  code?: number;
};

export async function fetchSongUrl(id: number): Promise<string | null> {
  const url = new URL('/netease/song/url', API_BASE);
  url.searchParams.set('id', String(id));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Song URL failed');
  }
  const data = (await res.json()) as SongUrlResponse;
  return data.data?.[0]?.url ?? null;
}

type LyricResponse = {
  lrc?: { lyric?: string };
  code?: number;
};

export async function fetchLyric(id: number): Promise<LyricLine[]> {
  const url = new URL('/netease/lyric', API_BASE);
  url.searchParams.set('id', String(id));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Lyric failed');
  }
  const data = (await res.json()) as LyricResponse;
  const lyric = data.lrc?.lyric ?? '';
  return parseLyric(lyric);
}

const timePattern = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?]/g;

export function parseLyric(source: string): LyricLine[] {
  const lines = source.split(/\r?\n/);
  const result: LyricLine[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const text = line.replace(timePattern, '').trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    timePattern.lastIndex = 0;
    while ((match = timePattern.exec(line))) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3] ? Number(match[3].padEnd(3, '0')) : 0;
      const time = minutes * 60 + seconds + fraction / 1000;
      result.push({ time, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
