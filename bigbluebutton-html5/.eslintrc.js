module.exports = {
  'extends': 'airbnb',
  'plugins': [
    'react',
    'jsx-a11y',
    'import',
  ],
  'env': {
    'es6': true,
    'node': true,
    'browser': true,
    'meteor': true,
    'jasmine': true,
  },
  'rules': {
    'no-underscore-dangle': 0,
    'import/extensions': [2, 'never'],
    'import/no-absolute-path': 0,
    'import/no-unresolved': 0,
    'import/no-extraneous-dependencies': 1,
    'react/prop-types': 1,
    'linebreak-style': ['error', 'windows'],
    'max-len': 0,
    'jsx-a11y/label-has-for': 0,
    'consistent-return': 0
  },
  'globals': {
    'browser': 'writable',
  },
};
