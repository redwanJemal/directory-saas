module.exports = function (api) {
  api.cache.using(() => process.env.EXPO_PUBLIC_PLATFORM || 'default');

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
