import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createPlaylist,
  deletePlaylist,
  fetchPlaylists,
  updatePlaylist,
  type Playlist,
} from '../lib/api';
import { fetchSongsByIds, type NeteaseTrack } from '../lib/netease';

type EditDraft = {
  id: string;
  name: string;
  description: string;
  trackIds: string;
};

const TEXT = {
  createTitle: '新建歌单',
  namePlaceholder: '歌单名称',
  descPlaceholder: '描述（可选）',
  trackIdsPlaceholder: '歌曲ID（用逗号或空格分隔）',
  creating: '创建中...',
  create: '创建歌单',
  nameRequired: '歌单名称不能为空。',
  createFailed: '创建歌单失败',
  savedTitle: '我的歌单',
  empty: '暂无歌单。',
  saving: '保存中...',
  save: '保存',
  cancel: '取消',
  updateFailed: '更新歌单失败',
  edit: '编辑',
  addToQueue: '加入播放列表',
  deleting: '删除中...',
  delete: '删除',
  deleteConfirmPrefix: '确定删除“',
  deleteConfirmSuffix: '”吗？',
};

export const PlaylistsPage = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackLookup, setTrackLookup] = useState<Record<string, NeteaseTrack>>({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trackIdsInput, setTrackIdsInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPlaylists = () => {
    let alive = true;
    setLoading(true);

    fetchPlaylists()
      .then((data) => {
        if (alive) {
          setPlaylists(data);
        }
      })
      .catch(() => {})
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

  const allTrackIds = useMemo(() => {
    const ids = playlists.flatMap((playlist) => playlist.trackIds ?? []);
    return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  }, [playlists]);

  useEffect(() => {
    const missing = allTrackIds.filter((id) => !trackLookup[id]);
    if (missing.length === 0) return;

    let alive = true;
    const chunkSize = 200;

    const loadTracks = async () => {
      try {
        const collected: NeteaseTrack[] = [];
        for (let i = 0; i < missing.length; i += chunkSize) {
          const chunk = missing.slice(i, i + chunkSize);
          const list = await fetchSongsByIds(chunk);
          collected.push(...list);
        }
        if (!alive || collected.length === 0) return;
        setTrackLookup((prev) => {
          const next = { ...prev };
          collected.forEach((track) => {
            next[String(track.id)] = track;
          });
          return next;
        });
      } catch {
        // ignore load failures for now
      }
    };

    loadTracks();

    return () => {
      alive = false;
    };
  }, [allTrackIds, trackLookup]);

  const parseTrackIds = (value: string) =>
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setCreateError(TEXT.nameRequired);
      return;
    }

    const ids = parseTrackIds(trackIdsInput);
    setCreating(true);
    setCreateError(null);

    try {
      const created = await createPlaylist({
        name: trimmedName,
        description: description.trim() || undefined,
        trackIds: ids.length ? ids : undefined,
      });
      setPlaylists((prev) => [created, ...prev]);
      setName('');
      setDescription('');
      setTrackIdsInput('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : TEXT.createFailed);
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (playlist: Playlist) => {
    setEditError(null);
    setEditing({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? '',
      trackIds: (playlist.trackIds ?? []).join(', '),
    });
  };

  const handleEditSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    const trimmedName = editing.name.trim();
    if (!trimmedName) {
      setEditError(TEXT.nameRequired);
      return;
    }

    const trimmedDescription = editing.description.trim();
    const ids = parseTrackIds(editing.trackIds);
    setSavingId(editing.id);
    setEditError(null);

    try {
      const updated = await updatePlaylist(editing.id, {
        name: trimmedName,
        description: trimmedDescription === '' ? null : trimmedDescription,
        trackIds: ids,
      });
      setPlaylists((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : TEXT.updateFailed);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (playlist: Playlist) => {
    const confirmed = window.confirm(
      `${TEXT.deleteConfirmPrefix}${playlist.name}${TEXT.deleteConfirmSuffix}`,
    );
    if (!confirmed) return;

    setDeleteId(playlist.id);

    try {
      await deletePlaylist(playlist.id);
      setPlaylists((prev) => prev.filter((item) => item.id !== playlist.id));
    } catch {
    } finally {
      setDeleteId(null);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const ids = playlist.trackIds ?? [];
    if (ids.length === 0) {
      return;
    }
    window.sessionStorage.setItem(
      'player-queue',
      JSON.stringify({ trackIds: ids, name: playlist.name }),
    );
    navigate('/');
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-6 pb-16 pt-10">

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={handleCreate}
          className="panel panel-strong float-in delay-1 flex flex-col gap-4 rounded-[var(--radius-lg)] px-6 py-5"
        >
          <div>
            <p className="title-font text-lg text-[color:var(--accent-800)]">{TEXT.createTitle}</p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={TEXT.namePlaceholder}
              className="rounded-[var(--radius-md)] border border-white/70 bg-white/80 px-3 py-2 text-[color:var(--ink)] outline-none focus:ring-2 focus:ring-[color:var(--accent-300)]"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={TEXT.descPlaceholder}
              rows={3}
              className="resize-none rounded-[var(--radius-md)] border border-white/70 bg-white/80 px-3 py-2 text-[color:var(--ink)] outline-none focus:ring-2 focus:ring-[color:var(--accent-300)]"
            />
            <textarea
              value={trackIdsInput}
              onChange={(event) => setTrackIdsInput(event.target.value)}
              placeholder={TEXT.trackIdsPlaceholder}
              rows={2}
              className="resize-none rounded-[var(--radius-md)] border border-white/70 bg-white/80 px-3 py-2 text-[color:var(--ink)] outline-none focus:ring-2 focus:ring-[color:var(--accent-300)]"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-fit rounded-full border border-[color:var(--accent-200)] bg-white/70 px-4 py-2 text-sm text-[color:var(--accent-700)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? TEXT.creating : TEXT.create}
          </button>
          {createError && <p className="text-sm text-[color:var(--accent-700)]">{createError}</p>}
        </form>

        <div className="panel float-in delay-2 flex flex-col gap-4 rounded-[var(--radius-lg)] px-6 py-5">
          <div>
            <p className="title-font text-lg text-[color:var(--accent-800)]">{TEXT.savedTitle}</p>
          </div>

          {!loading && playlists.length === 0 && (
            <p className="text-sm text-[color:var(--muted)]">{TEXT.empty}</p>
          )}

          <div className="flex flex-col gap-3">
            {playlists.map((playlist) => {
              const isEditing = editing?.id === playlist.id;
              const trackIds = (playlist.trackIds ?? []).map((id) => id.trim()).filter(Boolean);
              return (
                <div
                  key={playlist.id}
                  className="rounded-[var(--radius-md)] border border-white/60 bg-white/70 p-4 text-sm"
                >
                  {isEditing ? (
                    <form onSubmit={handleEditSave} className="flex flex-col gap-3">
                      <input
                        value={editing?.name ?? ''}
                        onChange={(event) =>
                          setEditing((prev) =>
                            prev ? { ...prev, name: event.target.value } : prev,
                          )
                        }
                        className="rounded-[var(--radius-md)] border border-white/70 bg-white/80 px-3 py-2 text-[color:var(--ink)] outline-none focus:ring-2 focus:ring-[color:var(--accent-300)]"
                      />
                      <textarea
                        value={editing?.description ?? ''}
                        onChange={(event) =>
                          setEditing((prev) =>
                            prev ? { ...prev, description: event.target.value } : prev,
                          )
                        }
                        rows={2}
                        className="resize-none rounded-[var(--radius-md)] border border-white/70 bg-white/80 px-3 py-2 text-[color:var(--ink)] outline-none focus:ring-2 focus:ring-[color:var(--accent-300)]"
                      />
                      <div className="rounded-[var(--radius-md)] border border-white/70 bg-white/80 px-3 py-2 text-[color:var(--ink)]">
                        {(() => {
                          const ids = parseTrackIds(editing.trackIds);
                          if (ids.length === 0) {
                            return (
                              <p className="text-xs text-[color:var(--muted)]">暂无歌曲</p>
                            );
                          }
                          return (
                            <ul className="space-y-2 text-sm">
                              {ids.map((id, index) => {
                                const track = trackLookup[id];
                                return (
                                  <li
                                    key={`${editing.id}-${id}`}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span className="min-w-0 truncate">
                                      {index + 1}. {track ? `${track.title} / ${track.artist}` : '加载中...'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = ids.filter((item) => item !== id);
                                        setEditing((prev) =>
                                          prev ? { ...prev, trackIds: next.join(', ') } : prev,
                                        );
                                      }}
                                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--accent-200)] text-xs text-[color:var(--accent-700)] transition hover:bg-white"
                                      aria-label="移除歌曲"
                                    >
                                      ×
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        })()}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          disabled={savingId === playlist.id}
                          className="rounded-full border border-[color:var(--accent-200)] bg-white px-3 py-1 text-xs text-[color:var(--accent-700)] transition hover:bg-white/90 disabled:cursor-not-allowed"
                        >
                          {savingId === playlist.id ? TEXT.saving : TEXT.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-full border border-transparent px-3 py-1 text-xs text-[color:var(--muted)] hover:bg-white/70"
                        >
                          {TEXT.cancel}
                        </button>
                        {editError && (
                          <span className="text-xs text-[color:var(--accent-700)]">{editError}</span>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="font-semibold text-[color:var(--ink)]">{playlist.name}</p>
                        {playlist.description && (
                          <p className="text-xs text-[color:var(--muted)]">{playlist.description}</p>
                        )}
                        <p className="text-xs text-[color:var(--muted)]">{`共 ${trackIds.length} 首`}</p>
                        {trackIds.length > 0 && (
                          <div className="mt-2 rounded-[var(--radius-sm)] bg-white/60 px-3 py-2">
                            <ul className="space-y-1 text-xs text-[color:var(--ink)]">
                              {trackIds.map((id, index) => {
                                const track = trackLookup[id];
                                return (
                                  <li key={`${playlist.id}-${id}`} className="flex items-center gap-2">
                                    <span className="w-6 text-right text-[color:var(--muted)] tabular-nums">
                                      {index + 1}.
                                    </span>
                                    <span className="truncate">
                                      {track ? `${track.title} / ${track.artist}` : ''}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayPlaylist(playlist)}
                          disabled={trackIds.length === 0}
                          className="rounded-full border border-[color:var(--accent-200)] bg-white px-3 py-1 text-xs text-[color:var(--accent-700)] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {TEXT.addToQueue}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(playlist)}
                          className="rounded-full border border-[color:var(--accent-200)] bg-white px-3 py-1 text-xs text-[color:var(--accent-700)] transition hover:bg-white/90"
                        >
                          {TEXT.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(playlist)}
                          disabled={deleteId === playlist.id}
                          className="rounded-full border border-transparent px-3 py-1 text-xs text-[color:var(--accent-700)] hover:bg-white/70 disabled:cursor-not-allowed"
                        >
                          {deleteId === playlist.id ? TEXT.deleting : TEXT.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};