import { usePlayerStore } from '../store/usePlayerStore';

// 定义胶片上的孔位位置
const reelHoles = [
  { top: '14%', left: '50%' },
  { top: '26%', left: '72%' },
  { top: '50%', left: '82%' },
  { top: '74%', left: '72%' },
  { top: '86%', left: '50%' },
  { top: '74%', left: '28%' },
  { top: '50%', left: '18%' },
  { top: '26%', left: '28%' },
];

export const PlayerShell = () => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isActive = Boolean(currentSong);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-10">
      <div className="relative h-64 w-64 sm:h-80 sm:w-80">
        <div
          className={`absolute inset-0 rounded-full border border-gray-300 ${isActive ? 'animate-spin' : ''}`}
          style={{ animationDuration: '18s' }}
        >
          <div className="absolute inset-8 rounded-full border border-gray-300" />
          <div className="absolute inset-20 rounded-full bg-gray-100" />
          <div className="absolute inset-[45%] rounded-full bg-gray-300" />

          {reelHoles.map((hole) => (
            <span
              key={`${hole.top}-${hole.left}`}
              className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-300 bg-white"
              style={{ top: hole.top, left: hole.left }}
            />
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-gray-600">
        {currentSong ? `${currentSong.title} - ${currentSong.artist}` : '请选择一首歌'}
      </div>
    </section>
  );
};
