import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchLyric,
  fetchSongUrl,
  searchSongs,
  type LyricLine,
  type NeteaseTrack,
} from '../lib/netease';

const themeSwatches = [
  { name: 'rose', className: 'bg-rose-300' },
  { name: 'sage', className: 'bg-[#c7d4c0]' },
  { name: 'peach', className: 'bg-orange-200' },
  { name: 'cream', className: 'bg-amber-100' },
  { name: 'sky', className: 'bg-sky-200' },
  { name: 'lavender', className: 'bg-violet-200' },
];

const fallbackLyrics = [
  'Search for a song to begin',
  'Pick one result on the right panel',
  'Lyrics will appear here automatically',
];

export const PlayerShell = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const wasPlayingRef = useRef(false);

  const [query, setQuery] = useState('周杰伦');
  const [results, setResults] = useState<NeteaseTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentTrack, setCurrentTrack] = useState<NeteaseTrack | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricLoading, setLyricLoading] = useState(false);

  const [likedIds, setLikedIds] = useState<Set<number>>(() => new Set());
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const performSearch = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    try {
      const list = await searchSongs(trimmed);
      setResults(list);
      setCurrentTrack(list[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setCurrentTrack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleTime = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isDragging]);

  useEffect(() => {
    wasPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!currentTrack) {
      setAudioUrl(null);
      setLyrics([]);
      return;
    }

    let alive = true;
    setAudioError(null);
    setLyricLoading(true);

    fetchSongUrl(currentTrack.id)
      .then((url) => {
        if (!alive) return;
        setAudioUrl(url);
        if (!url) {
          setAudioError('This track has no playable source.');
        }
      })
      .catch(() => {
        if (!alive) return;
        setAudioUrl(null);
        setAudioError('Failed to load audio source.');
      });

    fetchLyric(currentTrack.id)
      .then((lines) => {
        if (!alive) return;
        setLyrics(lines);
      })
      .catch(() => {
        if (!alive) return;
        setLyrics([]);
      })
      .finally(() => {
        if (!alive) return;
        setLyricLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const shouldResume = wasPlayingRef.current;
    audio.load();
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    if (audioUrl && shouldResume) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
    if (!audioUrl) {
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      return '00:00';
    }
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const seekTo = (clientX: number) => {
    const audio = audioRef.current;
    const bar = barRef.current;
    if (!audio || !bar || duration === 0) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const nextTime = ratio * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    seekTo(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    seekTo(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const activeLine = useMemo(() => {
    if (!lyrics.length) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i += 1) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTime, lyrics]);

  useEffect(() => {
    lineRefs.current = [];
  }, [lyrics]);

  useEffect(() => {
    if (!lyrics.length || activeLine < 0) return;
    const line = lineRefs.current[activeLine];
    if (!line) return;
    const frame = requestAnimationFrame(() => {
      line.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeLine, lyrics]);

  const trackIndex = currentTrack
    ? results.findIndex((track) => track.id === currentTrack.id)
    : -1;

  const playPrev = () => {
    if (!results.length || trackIndex === -1) return;
    const nextIndex = (trackIndex - 1 + results.length) % results.length;
    setCurrentTrack(results[nextIndex]);
  };

  const playNext = () => {
    if (!results.length || trackIndex === -1) return;
    const nextIndex = (trackIndex + 1) % results.length;
    setCurrentTrack(results[nextIndex]);
  };

  const toggleLike = (trackId: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.95fr)]">
        <div className="panel float-in delay-1 flex flex-col items-center rounded-3xl p-6 text-center">
          <div className="relative w-full max-w-[260px]">
            <div
              className={`relative aspect-square w-full rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.9),rgba(19,34,23,0.95))] shadow-2xl ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '18s' }}
            >
              <div className="absolute inset-4 rounded-full border border-white/60" />
              <div className="absolute inset-9 overflow-hidden rounded-full border border-rose-200/70 bg-white/70">
                {currentTrack?.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={`${currentTrack.title} cover`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-rose-300 text-xs font-semibold text-rose-800">
                    {currentTrack ? currentTrack.title.slice(0, 6) : 'No Cover'}
                  </div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_60%)]" />
              </div>
              <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-200 bg-white/85" />
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <p className="title-font text-xl text-[color:var(--accent-strong)]">
              {currentTrack?.title ?? 'No track selected'}
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              {currentTrack?.artist ?? 'Search and select a track'}
            </p>
          </div>
          <div className="mt-6 rounded-2xl bg-white/50 px-4 py-3 text-xs text-[color:var(--muted)]">
            <p>Album: {currentTrack?.album ?? 'Unknown'}</p>
            <p>Source: Netease Cloud (proxy)</p>
          </div>
          <div className="mt-5 w-full">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">theme</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {themeSwatches.map((swatch) => (
                <span key={swatch.name} className={`h-6 w-6 rounded-full shadow ${swatch.className}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="panel panel-strong float-in delay-2 flex min-h-0 flex-col rounded-3xl p-6">
          <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white/70 text-rose-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={!audioUrl}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M8 5l11 7-11 7V5z" />
                </svg>
              )}
            </button>
            <span>{formatTime(currentTime)}</span>
            <div
              ref={barRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-rose-200/60"
              aria-label="Playback progress"
            >
              <div
                className="absolute left-0 top-0 h-1.5 rounded-full bg-rose-500/70"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-rose-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 10v4h4l5 4V6l-5 4H4z" />
                <path d="M16 9a4 4 0 010 6" />
              </svg>
            </div>
          </div>

          {audioError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{audioError}</p>
          )}

          <div
            ref={lyricContainerRef}
            className="lyrics-scroll mt-5 flex-1 overflow-y-auto rounded-3xl bg-white/55 px-6 py-5 text-center text-sm leading-6 text-[color:var(--muted)] shadow-inner max-h-[45vh] lg:max-h-[50vh]"
          >
            {lyricLoading ? (
              <p className="text-sm text-[color:var(--muted)]">Loading lyrics...</p>
            ) : (
              <div className="space-y-2">
                {lyrics.length
                  ? lyrics.map((line, index) => (
                      <p
                        key={`${line.time}-${index}`}
                        ref={(el) => {
                          lineRefs.current[index] = el;
                        }}
                        className={`transition-all ${
                          index === activeLine
                            ? 'title-font text-base text-rose-900'
                            : 'text-[color:var(--muted)] opacity-70'
                        }`}
                      >
                        {line.text}
                      </p>
                    ))
                  : fallbackLyrics.map((line, index) => (
                      <p key={`${line}-${index}`} className="text-[color:var(--muted)] opacity-70">
                        {line}
                      </p>
                    ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white/70 text-rose-700 transition hover:bg-white"
              aria-label="Shuffle"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4h4l4 6" />
                <path d="M4 20h4l4-6" />
                <path d="M16 4h4v4" />
                <path d="M20 4l-4 4" />
                <path d="M16 20h4v-4" />
                <path d="M20 20l-4-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={playPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white/70 text-rose-700 transition hover:bg-white"
              aria-label="Previous track"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 5v14" />
                <path d="M18 6l-8 6 8 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={!audioUrl}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M8 5l11 7-11 7V5z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={playNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white/70 text-rose-700 transition hover:bg-white"
              aria-label="Next track"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 5v14" />
                <path d="M6 6l8 6-8 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => currentTrack && toggleLike(currentTrack.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                currentTrack && likedIds.has(currentTrack.id)
                  ? 'border-rose-200 bg-rose-100 text-rose-600'
                  : 'border-rose-200 bg-white/70 text-rose-700 hover:bg-white'
              }`}
              aria-label="Like"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 20s-6.5-4.4-8.4-7.6C2.1 9.9 3 7 5.6 6.1 7.4 5.5 9.4 6.1 10.5 7.6L12 9.5l1.5-1.9c1.1-1.5 3.1-2.1 4.9-1.5 2.6.9 3.5 3.8 2 6.3C18.5 15.6 12 20 12 20z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="panel float-in delay-3 flex flex-col gap-4 rounded-3xl p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              performSearch(query);
            }}
            className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2 text-sm text-[color:var(--muted)] shadow-inner"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              className="w-full bg-transparent outline-none placeholder:text-[color:var(--muted)]"
              placeholder="Search on Netease"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="submit"
              className="rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs text-rose-700 shadow-sm hover:bg-white"
              disabled={loading}
            >
              {loading ? '...' : 'Search'}
            </button>
          </form>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
          {!error && !loading && results.length === 0 && (
            <p className="rounded-xl bg-white/70 px-3 py-2 text-xs text-[color:var(--muted)]">
              No results. Try another keyword.
            </p>
          )}

          <div className="space-y-3">
            {results.map((track, index) => {
              const isActive = track.id === currentTrack?.id;
              const isLiked = likedIds.has(track.id);
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setCurrentTrack(track)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-rose-300 bg-white/80'
                      : 'border-transparent bg-white/40 hover:bg-white/70'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl bg-rose-200 text-xs font-semibold tabular-nums text-rose-900">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--ink)]">{track.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">{track.artist}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleLike(track.id);
                    }}
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border transition ${
                      isLiked
                        ? 'border-rose-200 bg-rose-100 text-rose-600'
                        : 'border-rose-200 bg-white/70 text-rose-700 hover:bg-white'
                    }`}
                    aria-label="Like track"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M12 20s-6.5-4.4-8.4-7.6C2.1 9.9 3 7 5.6 6.1 7.4 5.5 9.4 6.1 10.5 7.6L12 9.5l1.5-1.9c1.1-1.5 3.1-2.1 4.9-1.5 2.6.9 3.5 3.8 2 6.3C18.5 15.6 12 20 12 20z" />
                    </svg>
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl ?? ''} preload="metadata" />
    </section>
  );
};
