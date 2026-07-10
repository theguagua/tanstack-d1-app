import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // kumo 组件库的 CSS 使用 @theme 令牌，lightningcss 会将其当作未知 at-rule 丢弃，
  // 导致 bg-kumo-base 等组件样式丢失。改用 esbuild 处理 CSS 以保留 @theme。
  css: {
    transformer: 'postcss',
    lightningcss: false,
  },
  build: {
    cssMinify: 'esbuild',
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      target: 'cloudflare',
    }),
    viteReact(),
  ],
});
