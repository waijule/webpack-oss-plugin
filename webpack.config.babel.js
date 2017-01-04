import path from 'path'
import {DefinePlugin} from 'webpack'

const CONTEXT = path.resolve(__dirname),
      {NODE_ENV} = process.env,
      createPath = nPath => path.resolve(CONTEXT, nPath),
      SRC_PATH = createPath('src'),
      NODE_MODULES = createPath('node_modules')

var config = {
  context: CONTEXT,
  entry: ['babel-polyfill', './src/oss_plugin.js'],
  target: 'node',

  output: {
    path: createPath('dist'),
    library: 'webpack-oss-plugin',
    libraryTarget: 'umd',
    filename: 'oss_plugin.js'
  },

  plugins: [
    new DefinePlugin({
      __DEV__: NODE_ENV === 'development' || NODE_ENV === 'test'
    })
  ],

  module: {
    preLoaders: [{
      test: /\.js/,
      loader: 'eslint',
      include: [SRC_PATH],
      exclude: [NODE_MODULES]
    }],
    loaders: [{
      test: /\.js/,
      loader: 'babel',
      include: [SRC_PATH, createPath('test')],
      exclude: [NODE_MODULES]
    }]
  },

  externals: NODE_ENV === 'test' ? [] : [
    'lodash',
    'ali-oss',
    'recursive-readdir',
    'co',
  ],

  resolve: {
    extensions: ['.js', '']
  }
}

module.exports = config
