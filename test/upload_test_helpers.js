import _ from 'lodash'
import http from 'http'
import path from 'path'
import webpack from 'webpack'
import fs from 'fs'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ossOpts from './oss_options'
import OSSWebpackPlugin from '../src/oss_plugin'
import {assert} from 'chai'
import {spawnSync} from 'child_process'

const OSS_URL = `http://${ossOpts.OSS_BUCKET}.${ossOpts.OSS_REGION}.aliyuncs.com/`,
      OSS_ERROR_REGEX = /<Error>/,
      OUTPUT_FILE_NAME = 'ossTest',
      OUTPUT_PATH = path.resolve(__dirname, '.tmp'),
      ENTRY_PATH = path.resolve(__dirname, 'fixtures/index.js'),
      createBuildFailError = errors => `Webpack Build Failed ${errors}`;

var deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      var curPath = `${path}/${file}`;

      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath)
      } else { // delete file
        fs.unlinkSync(curPath)
      }
    });

    fs.rmdirSync(path)
  }
};

var generateOSSConfig = function(config) {
  var params = _.merge({}, {
    ossOptions: ossOpts.ossOptions,
    ossUploadOptions: ossOpts.ossUploadOptions
  }, config);

  return new OSSWebpackPlugin(params)
};

export default {
  OUTPUT_FILE_NAME,
  OUTPUT_PATH,
  OSS_URL,
  OSS_ERROR_REGEX,

  fetch(url) {
    return new Promise(function(resolve, reject) {
      http.get(url, function(response) {
        var body = '';

        response.on('data', data => body += data);
        response.on('end', () => resolve(body));
        response.on('error', reject);
      })
    })
  },

  addSlashToPath(pathName) {
    return pathName.endsWith(path.sep) ? pathName : pathName + path.sep
  },

  createFolder(pathToFolder) {
    spawnSync('mkdir', ['-p', pathToFolder], {stdio: 'inherit'})
  },

  testForFailFromStatsOrGetOSSFiles({errors, stats}) {
    if (errors)
      return assert.fail([], errors, createBuildFailError(errors))

    return this.getBuildFilesFromOSS(this.getFilesFromStats(stats))
  },

  testForFailFromDirectoryOrGetOSSFiles(directory) {
    return ({errors}) => {
      var basePath = this.addSlashToPath(`${directory}`)

      if (errors)
        return assert.fail([], errors, createBuildFailError(errors))
      else
        return this.getBuildFilesFromOSS(this.getFilesFromDirectory(directory, basePath))
    }
  },

  cleanOutputDirectory() {
    deleteFolderRecursive(OUTPUT_PATH)
  },

  createOutputPath() {
    if (!fs.existsSync(OUTPUT_PATH))
      fs.mkdirSync(OUTPUT_PATH)
  },

  createRandomFile(newPath) {
    var hash = Math.random() * 10000,
        fileName = `random-file-${hash}`,
        newFileName = `${newPath}/${fileName}`

    // Create Random File to upload
    fs.writeFileSync(newFileName, `This is a new file - ${hash}`)

    return {fullPath: newFileName, fileName}
  },

  createWebpackConfig({config, ossConfig} = {}) {
    return _.extend({
      entry: ENTRY_PATH,
      plugins: [
        new HtmlWebpackPlugin(),
        generateOSSConfig(ossConfig)
      ],
      output: {
        path: OUTPUT_PATH,
        filename: `${OUTPUT_FILE_NAME}-[hash]-${+new Date()}.js`
      }
    }, config)
  },

  runWebpackConfig({config}) {
    this.createOutputPath()

    return new Promise(function(resolve) {
      webpack(config, function(err, stats) {
        if (stats.toJson().errors.length)
          resolve({errors: stats.toJson().errors})
        else
          resolve({config, stats})
      })
    })
  },

  getFilesFromDirectory(directory, basePath) {
    var res = (function readDirectory(dir) {
      return fs.readdirSync(dir)
        .reduce(function(res, file) {
          var fPath = path.resolve(dir, file)

          if (fs.lstatSync(fPath).isDirectory())
            res.push(...readDirectory(fPath))
          else
            res.push(fPath)

          return res
        }, [])
    }).call(this, directory)

    return res
      .map(file => file.replace(basePath, ''))
  },

  getFilesFromStats(stats) {
    return _.map(stats.toJson().assets, 'name')
  },

  getBuildFilesFromOSS(files) {
    var fetchFiles = files
      .filter(file => !/.*\.html$/.test(file))

    return Promise.all(fetchFiles.map(file => this.fetch(OSS_URL + file)))
      .then(nFiles => nFiles.map((file, i) => {
        var fetchFile = fetchFiles[i]

        return {
          name: fetchFile,
          ossUrl: OSS_URL + fetchFile,
          actual: file,
          expected: this.readFileFromOutputDir(fetchFile)
        }
      }))
  },

  readFileFromOutputDir(file) {
    return fs.readFileSync(path.resolve(OUTPUT_PATH, file)).toString()
  },

  testForErrorsOrGetFileNames({stats, errors}) {
    if (errors)
      return assert.fail([], errors, createBuildFailError(errors))

    return this.getFilesFromStats(stats)
  },

  assertFileMatches(files) {
    var errors = _(files)
      .map(({expected, actual, name, ossUrl}) => {
        return assert.equal(actual, expected, `File: ${name} URL: ${ossUrl} - NO MATCH`)
      })
      .compact()
      .value()

    return Promise.all(_.some(errors) ? errors : files)
  },
}
