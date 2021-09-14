const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Caching',
    }),
    new CopyPlugin({
        patterns: [
            {from: 'src/audio', to: 'audio'}
        ]
    }),
    new WebpackManifestPlugin({})
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: "", // To resolve the WebpackManifestPlugin prefixing output with "auto"
  },
};