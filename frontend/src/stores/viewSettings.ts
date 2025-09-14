import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'grid' | 'list';
export type PreviewSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ViewSettings {
  viewMode: ViewMode;
  previewSize: PreviewSize;
  setViewMode: (mode: ViewMode) => void;
  setPreviewSize: (size: PreviewSize) => void;
}

// 预览图大小配置
export const previewSizeConfig = {
  xs: { 
    cols: 'grid-cols-[repeat(auto-fill,minmax(80px,1fr))]', 
    itemWidth: 'w-16', 
    itemHeight: 'h-16',
    containerClass: 'min-w-[80px]'
  },
  sm: { 
    cols: 'grid-cols-[repeat(auto-fill,minmax(100px,1fr))]', 
    itemWidth: 'w-20', 
    itemHeight: 'h-20',
    containerClass: 'min-w-[100px]'
  },
  md: { 
    cols: 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))]', 
    itemWidth: 'w-24', 
    itemHeight: 'h-24',
    containerClass: 'min-w-[120px]'
  },
  lg: { 
    cols: 'grid-cols-[repeat(auto-fill,minmax(160px,1fr))]', 
    itemWidth: 'w-32', 
    itemHeight: 'h-32',
    containerClass: 'min-w-[160px]'
  },
  xl: { 
    cols: 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]', 
    itemWidth: 'w-40', 
    itemHeight: 'h-40',
    containerClass: 'min-w-[200px]'
  }
};

export const useViewSettings = create<ViewSettings>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      previewSize: 'md',
      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
      setPreviewSize: (size: PreviewSize) => set({ previewSize: size }),
    }),
    {
      name: 'file-view-settings',
    }
  )
);