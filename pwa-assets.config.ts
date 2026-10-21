import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'
import { tokens } from './src/theme/tokens'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: tokens.color.page } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: tokens.color.page } },
  },
  images: ['public/logo.svg'],
})
