// eslint.config.mjs
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { FlatCompat } from '@eslint/eslintrc'
import { patchEslintModule } from '@rushstack/eslint-patch'

// Apply the Next/rushstack module-resolution patch *before* loading configs
patchEslintModule()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  // Next.js recommended configs (via compat)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Global rule tweaks — downgrade noisy rules so builds don't fail
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // OPTIONAL: fully allow `any` in a few files if needed
  // {
  //   files: ['components/GlobeScene.tsx', 'components/RightDock.tsx', 'lib/sfx.ts'],
  //   rules: { '@typescript-eslint/no-explicit-any': 'off' },
  // },
]
