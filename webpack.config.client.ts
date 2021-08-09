import ReactRefreshPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import dotenv from 'dotenv';
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import reactRefreshTypescript from 'react-refresh-typescript';
import { EnvironmentPlugin } from 'webpack';
import { devMode, webpackConfig } from './webpack.config';

dotenv.config();

export default webpackConfig({
  name: 'client',
  target: 'web',
  entry: './src/client/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
  },
  resolve: { extensions: ['.tsx'] },
  devtool: devMode ? 'inline-source-map' : 'source-map',
  devServer: {
    hot: true,
    contentBase: [path.join(__dirname, 'public'), path.join(__dirname, 'dist/client')],
    compress: true,
    port: 8080,
    publicPath: '/',
  },
  plugins: [
    ...(devMode ? [] : [new MiniCssExtractPlugin()]),
    new ReactRefreshPlugin(),
    new EnvironmentPlugin('WS_URL'),
    new ForkTsCheckerPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      },
      eslint: { enabled: true, files: './src/client/**/*.{ts,js,tsx}' },
    }),
    new HtmlPlugin({
      template: path.resolve(__dirname, 'src/client/template.ejs'),
      filename: 'index.html',
      minify: 'auto',
      inject: false,
      chunks: ['main'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|mp3|ttf|eot|woff2?|md|svg)$/i,
        loader: require.resolve('file-loader'),
        options: { name: devMode ? '[name].[ext]' : '[contenthash].[ext]' },
      },
      {
        test: /\.tsx?$/i,
        loader: require.resolve('ts-loader'),
        include: path.resolve(__dirname, 'src/client'),
        options: <import('ts-node').CreateOptions>{
          compilerOptions: { module: 'esnext' },
          transpileOnly: true,
          getCustomTransformers: () => ({
            before: devMode ? [reactRefreshTypescript()] : [],
          }),
        },
      },
      {
        test: /\.(s[ac]|c)ss$/i,
        use: [
          devMode ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
          require.resolve('css-loader'),
          require.resolve('postcss-loader'),
          require.resolve('sass-loader'),
        ],
      },
    ],
  },
});
