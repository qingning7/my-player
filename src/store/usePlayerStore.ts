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

// 创建一个 Zustand Store，包含 currentSong 和 setCurrentSong 方法
// usePlayerStore 是一个函数，调用它会返回一个对象，这个对象包含 currentSong 和 setCurrentSong 方法
export const usePlayerStore = create<PlayerState>((set) => ({// 这个函数接受一个 set 参数，set 是一个函数，用来更新 Store 中的状态
  currentSong: null, // 初始没有歌曲
  setCurrentSong: (song) => set({ currentSong: song }), // 定义 setCurrentSong 方法，接受一个 Song 对象，并更新 currentSong 的值
}));
