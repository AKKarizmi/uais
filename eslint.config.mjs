import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.next/**','node_modules/**','.npm-cache/**','playwright-report/**','test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files:['**/*.{ts,tsx}'],rules:{'@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]} },
  { files:['**/*.mjs'],languageOptions:{globals:{process:'readonly'}} },
)
