import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FileSpreadsheet,

  File,
  Settings,
  Database,
  Globe,
  Palette,
  Terminal,
  BookOpen,
  FileCode,
  FileJson,

  Cpu
} from 'lucide-react';

const fileTypeIcons: Record<string, React.ComponentType<any>> = {
  // 图片文件
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  svg: Image,
  webp: Image,
  bmp: Image,
  ico: Image,
  
  // 视频文件
  mp4: Video,
  avi: Video,
  mov: Video,
  wmv: Video,
  flv: Video,
  webm: Video,
  mkv: Video,
  
  // 音频文件
  mp3: Music,
  wav: Music,
  flac: Music,
  aac: Music,
  ogg: Music,
  wma: Music,
  
  // 压缩文件
  zip: Archive,
  rar: Archive,
  '7z': Archive,
  tar: Archive,
  gz: Archive,
  bz2: Archive,
  
  // 代码文件
  js: Code,
  ts: Code,
  jsx: Code,
  tsx: Code,
  vue: Code,
  py: Code,
  java: Code,
  cpp: Code,
  c: Code,
  cs: Code,
  php: Code,
  rb: Code,
  go: Code,
  rs: Code,
  swift: Code,
  kt: Code,
  scala: Code,
  
  // 配置文件
  json: FileJson,
  xml: FileCode,
  yaml: FileCode,
  yml: FileCode,
  toml: FileCode,
  ini: Settings,
  conf: Settings,
  config: Settings,
  
  // 文档文件
  txt: FileText,
  md: BookOpen,
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  rtf: FileText,
  
  // 表格文件
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  
  // 数据库文件
  db: Database,
  sqlite: Database,
  sql: Database,
  
  // Web文件
  html: Globe,
  htm: Globe,
  css: Palette,
  scss: Palette,
  sass: Palette,
  less: Palette,
  
  // 脚本文件
  sh: Terminal,
  bat: Terminal,
  cmd: Terminal,
  ps1: Terminal,
  
  // 可执行文件
  exe: Cpu,
  msi: Cpu,
  dmg: Cpu,
  pkg: Cpu,
  deb: Cpu,
  rpm: Cpu,
  
  // 其他
  log: FileText,
  lock: Settings,
  gitignore: Settings,
  env: Settings,
  dockerfile: Settings,
};

export const getFileIcon = (fileName: string, size: number = 16) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const IconComponent = extension ? fileTypeIcons[extension] : File;
  
  return React.createElement(IconComponent, { size });
};

export const getFileTypeColor = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const colorMap: Record<string, string> = {
    // 图片 - 绿色
    jpg: 'text-green-600',
    jpeg: 'text-green-600',
    png: 'text-green-600',
    gif: 'text-green-600',
    svg: 'text-green-600',
    webp: 'text-green-600',
    
    // 视频 - 红色
    mp4: 'text-red-600',
    avi: 'text-red-600',
    mov: 'text-red-600',
    mkv: 'text-red-600',
    
    // 音频 - 紫色
    mp3: 'text-purple-600',
    wav: 'text-purple-600',
    flac: 'text-purple-600',
    
    // 代码 - 蓝色
    js: 'text-blue-600',
    ts: 'text-blue-600',
    jsx: 'text-blue-600',
    tsx: 'text-blue-600',
    py: 'text-blue-600',
    java: 'text-blue-600',
    go: 'text-blue-600',
    
    // 样式 - 粉色
    css: 'text-pink-600',
    scss: 'text-pink-600',
    sass: 'text-pink-600',
    
    // 配置 - 橙色
    json: 'text-orange-600',
    xml: 'text-orange-600',
    yaml: 'text-orange-600',
    yml: 'text-orange-600',
    
    // 文档 - 灰色
    txt: 'text-gray-600',
    md: 'text-gray-600',
    pdf: 'text-gray-600',
  };
  
  return extension ? colorMap[extension] || 'text-gray-500' : 'text-gray-500';
};