import { create } from 'zustand';

// 定义一首歌的类型
interface Song {
  id: number;
  title: string;
  artist: string;
  url: string; // 歌曲播放地址
}

interface PlayerState {
  currentSong: Song | null;
  setCurrentSong: (song: Song) => void;// 参数名字是 song，参数是一个 Song 对象
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null, // 初始没有歌曲
  setCurrentSong: (song) => set({ currentSong: song }), // 定义 setCurrentSong 方法，接受一个 Song 对象，并更新 currentSong 的值
}));
