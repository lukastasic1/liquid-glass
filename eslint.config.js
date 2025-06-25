import nkzw from '@nkzw/eslint-config';

export default [
  ...nkzw,
  { ignores: ['liquid-glass-example/.next/**/*', 'lib/**/*'] },
];
