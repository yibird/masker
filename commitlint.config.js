/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow Chinese descriptions after the conventional type/subject.
    'subject-case': [0],
    'body-max-line-length': [1, 'always', 100],
    'header-max-length': [2, 'always', 100],
  },
};
