const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const FileManagerPlugin = require('filemanager-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer'),
    },
  },
  entry: {
    config: './src/configs.js',
    report_gen: './src/offscreen/report_gen.js',
    prompt_api: './src/offscreen/prompt_api.js',
    offscreen: './src/offscreen/offscreen.js',
    background: './src/background.js',
    utilities: './src/utilities.js'
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new CleanWebpackPlugin({cleanStaleWebpackAssets: false}),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "offscreen", "offscreen.html"),
      filename: "offscreen.html",
      chunks: ["offscreen", "report_gen", "prompt_api"]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: './src/manifest.json'},
        {from: './src/websites.json'},
        {from: './src/suspicious_tlds.csv'},
        {from: './src/content/', to: './content/'},
        {from: './src/images/', to: './images/'},
        {from: './src/sidepanel/prod/browser/', to: './sidepanel/'},
      ],
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          move: [
            {source: 'dist/offscreen.html', destination: 'dist/offscreen/offscreen.html'},
            {source: 'dist/offscreen.js', destination: 'dist/offscreen/offscreen.js'},
            {source: 'dist/report_gen.js', destination: 'dist/offscreen/report_gen.js'},
            {source: 'dist/prompt_api.js', destination: 'dist/offscreen/prompt_api.js'},
          ],
        }
      }
    })
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({extractComments: false, }),
    ],
  },
}