// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

// Préréglage AAK vendoré (réécrit à chaque /aak-sync) — conventions mécanisables.
// Import optionnel : le préréglage est propriétaire et gitignoré (dépôt public),
// donc absent d'un clone. On dégrade proprement sur les seules règles angular-eslint.
let aak = [];
try {
  ({ default: aak } = await import('./.claude/eslint/aak-conventions.mjs'));
} catch {
  // Préréglage AAK non vendoré localement — on continue sans.
}

export default tseslint.config(
  // Artefacts générés — jamais lintés.
  { ignores: ['dist/', '.angular/', 'out-tsc/', 'coverage/'] },
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  // En dernier : le footgun no-restricted-syntax veut que la dernière config qui
  // matche gagne. Aucune config ci-dessus ne pose no-restricted-syntax, donc le
  // spread est sûr (pas de fusion nécessaire pour l'instant).
  ...aak,
);
