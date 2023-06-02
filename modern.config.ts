import moduleTools, { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    autoExternal: false,
    externals: ['encoding', 'spawn-sync'],
    dts: false,
  },
  plugins: [moduleTools()]
});
