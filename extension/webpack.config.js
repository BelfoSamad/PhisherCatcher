const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const FileManagerPlugin = require('filemanager-webpack-plugin');


module.exports = {
  entry: {
    firebase_config: './src/firebase_config.js',
    offscreen: './src/offscreen/offscreen.js',
  },
  plugins: [
    new CleanWebpackPlugin({cleanStaleWebpackAssets: false}),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "offscreen", "offscreen.html"),
      filename: "offscreen.html",
      chunks: ["offscreen"]
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
            {source: 'dist/offscreen.html', destination: 'dist/offscreen/offscreen.html'},
            {source: 'dist/offscreen.js', destination: 'dist/offscreen/offscreen.js'},
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