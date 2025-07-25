const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    popup: './popup.js',
    login: './login.js',
    background: './background.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // This is crucial for Chrome Extensions to prevent issues with eval()
  devtool: 'cheap-module-source-map',
};