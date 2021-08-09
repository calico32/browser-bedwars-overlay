import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import _ from 'lodash/fp';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { BannerPlugin, Configuration, EnvironmentPlugin } from 'webpack';

export const devMode = process.env.NODE_ENV !== 'production';
export const webpackConfig = (config: Configuration): Configuration =>
  _.merge(
    <Configuration>{
      mode: devMode ? 'development' : 'production',
      cache: { type: 'filesystem' },
      devtool: devMode ? 'eval-cheap-module-source-map' : 'source-map',
      resolve: { extensions: ['.ts', '.js'] },
      stats: { preset: 'normal', colors: true },
      experiments: { topLevelAwait: true },
      watchOptions: {
        ignored: /dist|webpack\.config\.ts/,
      },
      optimization: {
        emitOnErrors: false,
        runtimeChunk: true,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
          chunks: 'all',
        },
        minimize: !devMode,
        minimizer: devMode ? undefined : [new TerserPlugin({ terserOptions: { mangle: false } })],
      },
      module: {
        rules: [{ test: /\.jsx?$/, enforce: 'pre', loader: require.resolve('source-map-loader') }],
      },
    },
    config
  );

export default webpackConfig({
  name: 'server',
  target: 'async-node',
  entry: './src/server/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/server'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    chunkFilename: '[name].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
    pathinfo: false,
  },
  externalsPresets: { node: true },
  // Every non-relative module is external
  // TODO: improve regexp
  externals: async ({ request }: { request?: string }) => {
    if (/^[^.][a-z\-0-9@/.]+$/.test(request ?? '')) return true;
    else return false;
  },
  // externals: /^[^.][a-z\-0-9@/.]+$/,
  node: { __dirname: true },
  plugins: [
    new EnvironmentPlugin({ WEBPACK: true }),
    new ForkTsCheckerPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      },
      eslint: { enabled: true, files: './src/server/**/*.{ts,js}' },
    }),
    new BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: require.resolve('ts-loader'),
        options: { happyPackMode: true },
        include: path.resolve(__dirname, 'src/server'),
      },
      { test: /\.node$/, use: require.resolve('node-loader') },
      { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
    ],
  },
});
