import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, Download, Eye, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onPreview?: () => void;
  onCopy?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  onCopy
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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
      label: t('file.contextMenu.preview'),
      onClick: onPreview,
      show: !!onPreview
    },
    {
      icon: Copy,
      label: t('file.contextMenu.copy'),
      onClick: onCopy,
      show: !!onCopy
    },
    {
      icon: Download,
      label: t('file.contextMenu.download'),
      onClick: onDownload,
      show: !!onDownload
    },
    {
      icon: Edit2,
      label: t('file.contextMenu.rename'),
      onClick: onRename,
      show: !!onRename
    },
    {
      icon: Trash2,
      label: t('common.delete'),
      onClick: onDelete,
      show: !!onDelete,
      className: 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
    }
  ].filter(item => item.show);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]"
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
            className={`w-full flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${
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