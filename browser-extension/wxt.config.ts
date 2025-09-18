import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'AiDeer Importer',
    description: '批量收集网页图片和视频到系统',
    version: '1.0.0',
    permissions: [
      'activeTab',
      'contextMenus',
      'storage'
    ],
    host_permissions: [
      '<all_urls>'
    ]
  },
  webExt: {
    disabled: true
  },
  analysis: {
    enabled: false
  },
  entrypointsDir: 'entrypoints',
  mode: 'production'
});