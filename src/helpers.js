import _ from 'lodash'
import path from 'path'
import readDir from 'recursive-readdir'

export const UPLOAD_IGNORES = [
  '.DS_Store'
]

export const REQUIRED_OSS_OPTS = ['region', 'accessKeyId', 'accessKeySecret', 'bucket']
export const PATH_SEP = path.sep
export const OSS_PATH_SEP = '/'
export const DEFAULT_TRANSFORM = (item) => Promise.resolve(item)

export const addTrailingOSSSep = fPath => {
  return fPath ? fPath.replace(/\/?(\?|#|$)/, '/$1') : fPath
}

export const addSeperatorToPath = (fPath) => {
  if (!fPath) {
    return fPath
  }

  return _.endsWith(fPath, PATH_SEP) ? fPath : fPath + PATH_SEP
}

export const translatePathFromFiles = (rootPath) => {
  return files => {
    return _.map(files, file => {
      return {
        path: file,
        name: file
          .replace(rootPath, '')
          .split(PATH_SEP)
          .join(OSS_PATH_SEP)
      }
    })
  }
}

export const getDirectoryFilesRecursive = (dir, ignores = []) => {
  return new Promise((resolve, reject) => {
    readDir(dir, ignores, (err, files) => err ? reject(err) : resolve(files))
  })
    .then(translatePathFromFiles(dir))
}
