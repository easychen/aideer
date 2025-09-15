// ElectronOnly.tsx
import React from "react";

/**
 * 检查当前是否在 Electron 环境中
 */
function isElectron(): boolean {
  if (typeof window !== "undefined") {
    // 方法一：Electron preload 注入的 process.type
    if ((window as any).process?.type) {
      return true;
    }
    // 方法二：通过 userAgent 判断
    if (navigator.userAgent.toLowerCase().includes("electron")) {
      return true;
    }
  }
  return false;
}

/**
 * 一个只在 Electron 环境下渲染 children 的组件
 */
const ElectronOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isElectron() ? <>{children}</> : null;
};

export default ElectronOnly;
