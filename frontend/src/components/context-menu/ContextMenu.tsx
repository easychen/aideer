import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, Download, Eye } from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onPreview?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onRename,
  onDelete,
  onDownload,
  onPreview
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      icon: Eye,
      label: '预览',
      onClick: onPreview,
      show: !!onPreview
    },
    {
      icon: Download,
      label: '下载',
      onClick: onDownload,
      show: !!onDownload
    },
    {
      icon: Edit2,
      label: '重命名',
      onClick: onRename,
      show: !!onRename
    },
    {
      icon: Trash2,
      label: '删除',
      onClick: onDelete,
      show: !!onDelete,
      className: 'text-red-600 hover:bg-red-50'
    }
  ].filter(item => item.show);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
              item.className || ''
            }`}
            onClick={() => {
              item.onClick?.();
              onClose();
            }}
          >
            <Icon className="w-4 h-4 mr-2" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;