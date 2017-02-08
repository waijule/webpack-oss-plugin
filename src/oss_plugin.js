import http from 'http'
import https from 'https'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import oss from 'ali-oss'
import co from 'co'

import {
  addSeperatorToPath,
  addTrailingOSSSep,
  getDirectoryFilesRecursive,
  UPLOAD_IGNORES,
  REQUIRED_OSS_OPTS,
  PATH_SEP,
  DEFAULT_TRANSFORM,
} from './helpers'

http.globalAgent.maxSockets = https.globalAgent.maxSockets = 50

var compileError = (compilation, error) => {
  compilation.errors.push(new Error(error))
}

module.exports = class OSSPlugin {
  constructor(options = {}) {
    var {
      include,
      exclude,
      basePath,
      directory,
      overwrite = true,
      basePathTransform = DEFAULT_TRANSFORM,
      ossOptions = {},
      ossUploadOptions = {},
    } = options

    this.uploadOptions = ossUploadOptions
    this.isConnected = false
    this.basePathTransform = basePathTransform
    basePath = basePath ? addTrailingOSSSep(basePath) : ''

    this.options = {
      directory,
      include,
      exclude,
      basePath,
      overwrite,
    }

    this.clientConfig = ossOptions
  }

  apply(compiler) {
    var isDirectoryUpload = !!this.options.directory,
        hasRequiredOptions = _.every(REQUIRED_OSS_OPTS, type => this.clientConfig[type])

    // Set directory to output dir or custom
    this.options.directory = this.options.directory ||
      compiler.options.output.path ||
      compiler.options.output.context ||
      '.'

    compiler.plugin('after-emit', (compilation, cb) => {
      var error

      if (!hasRequiredOptions) {
        error = `OSSPlugin: Must provide ${REQUIRED_OSS_OPTS.join(', ')}`
      }

      if (error) {
        compileError(compilation, error)
        cb()
      }

      this.connect()

      if (isDirectoryUpload) {
        this.fs = fs

        let dPath = addSeperatorToPath(this.options.directory)

        this.getAllFilesRecursive(dPath)
          .then((files) => this.handleFiles(files, cb))
          .then(() => cb())
          .catch(e => this.handleErrors(e, compilation, cb))
      } else {
        this.fs = compiler.outputFileSystem.createReadStream ? compiler.outputFileSystem : fs

        this.getAssetFiles(compilation)
          .then((files) => this.handleFiles(files))
          .then(() => cb())
          .catch(e => this.handleErrors(e, compilation, cb))
      }
    })
  }

  handleFiles(files) {
    return Promise.resolve(files)
      .then((files) => this.filterAllowedFiles(files))
      .then((files) => this.uploadFiles(files))
  }

  handleErrors(error, compilation, cb) {
    compileError(compilation, `OSSPlugin: ${error}`)
    cb()
  }

  getAllFilesRecursive(fPath) {
    return getDirectoryFilesRecursive(fPath)
  }

  addPathToFiles(files, fPath) {
    return files.map(file => ({name: file, path: path.resolve(fPath, file)}))
  }

  getFileName(file = '') {
    if (_.includes(file, PATH_SEP))
      return file.substring(_.lastIndexOf(file, PATH_SEP) + 1)
    else
      return file
  }

  getAssetFiles({assets}) {
    var files = _.map(assets, (value, name) => ({name, path: value.existsAt}))

    return Promise.resolve(files)
  }

  filterAllowedFiles(files) {
    return files.reduce((res, file) => {
      if (this.isIncludeAndNotExclude(file.name) && !this.isIgnoredFile(file.name)) {
        res.push(file)
      }

      return res
    }, [])
  }

  isIgnoredFile(file) {
    return _.some(UPLOAD_IGNORES, ignore => new RegExp(ignore).test(file))
  }

  isIncludeAndNotExclude(file) {
    var isExclude,
        isInclude,
        {include, exclude} = this.options

    isInclude = include ? include.test(file) : true
    isExclude = exclude ? exclude.test(file) : false

    return isInclude && !isExclude
  }

  connect() {
    if (this.isConnected) {
      return
    }

    this.client = oss(this.clientConfig)
    this.isConnected = true
  }

  transformBasePath() {
    return Promise.resolve(this.basePathTransform(this.options.basePath))
      .then(addTrailingOSSSep)
      .then(nPath => this.options.basePath = nPath)
  }

  uploadFiles(files = []) {
    return this.transformBasePath()
      .then(() => {
        return Promise.all(files.map(file => {
          return this.uploadFile(file.name, file.path)
            .then((uploadedFile) => {
              if (uploadedFile) {
                console.log(`${file.path} uploaded to ${uploadedFile.name}`)
              }
            }, (e) => {
              console.error(`${file.path} failed to upload`, e)
              return Promise.reject(e)
            })
        }))
      })
  }

  uploadFile(fileName, file) {
    const Key = this.options.basePath + fileName
    const client = this.client
    const fs = this.fs
    const overwrite = this.options.overwrite
    const ossParams = _.mapValues(this.uploadOptions, (optionConfig) => {
      return _.isFunction(optionConfig) ? optionConfig(fileName, file) : optionConfig
    })

    return co(function *() {
      if (!overwrite) {
        try {
          yield client.head(Key)
          console.log(`skipping upload of ${file}`)
          return
        } catch (e) {
          // file doesn't exist
        }
      }

      return yield client.putStream(Key, fs.createReadStream(file), ossParams)
    })
  }
}
