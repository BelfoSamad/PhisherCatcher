const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const FileManagerPlugin = require('filemanager-webpack-plugin');


module.exports = {
  entry: {
    firebase_config: './src/firebase_config.js',
    auth_offscreen: './src/offscreen/auth/auth_offscreen.js',
    data_offscreen: './src/offscreen/data/data_offscreen.js',
  },
  plugins: [
    new CleanWebpackPlugin({cleanStaleWebpackAssets: false}),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "offscreen/auth", "auth_offscreen.html"),
      filename: "auth_offscreen.html",
      chunks: ["auth_offscreen"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "offscreen/data", "data_offscreen.html"),
      filename: "data_offscreen.html",
      chunks: ["data_offscreen"]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: './src/manifest.json'},
        {from: './src/background.js'},
        {from: './src/content/script.js'},
        {from: './src/content/styles.css'}
      ],
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          move: [
            {source: 'dist/auth_offscreen.html', destination: 'dist/offscreen/auth/auth_offscreen.html'},
            {source: 'dist/auth_offscreen.js', destination: 'dist/offscreen/auth/auth_offscreen.js'},
            {source: 'dist/data_offscreen.html', destination: 'dist/offscreen/data/data_offscreen.html'},
            {source: 'dist/data_offscreen.js', destination: 'dist/offscreen/data/data_offscreen.js'},
            {source: 'dist/script.js', destination: 'dist/content/script.js'},
            {source: 'dist/styles.css', destination: 'dist/content/styles.css'},
          ]
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