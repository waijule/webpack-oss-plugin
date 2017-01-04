(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("http"), require("https"), require("path"), require("fs"), require("lodash"), require("ali-oss"), require("co"), require("recursive-readdir"));
	else if(typeof define === 'function' && define.amd)
		define(["http", "https", "path", "fs", "lodash", "ali-oss", "co", "recursive-readdir"], factory);
	else if(typeof exports === 'object')
		exports["webpack-oss-plugin"] = factory(require("http"), require("https"), require("path"), require("fs"), require("lodash"), require("ali-oss"), require("co"), require("recursive-readdir"));
	else
		root["webpack-oss-plugin"] = factory(root["http"], root["https"], root["path"], root["fs"], root["lodash"], root["ali-oss"], root["co"], root["recursive-readdir"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_10__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _http = __webpack_require__(2);

	var _http2 = _interopRequireDefault(_http);

	var _https = __webpack_require__(3);

	var _https2 = _interopRequireDefault(_https);

	var _path = __webpack_require__(4);

	var _path2 = _interopRequireDefault(_path);

	var _fs = __webpack_require__(5);

	var _fs2 = _interopRequireDefault(_fs);

	var _lodash = __webpack_require__(6);

	var _lodash2 = _interopRequireDefault(_lodash);

	var _aliOss = __webpack_require__(7);

	var _aliOss2 = _interopRequireDefault(_aliOss);

	var _co = __webpack_require__(8);

	var _co2 = _interopRequireDefault(_co);

	var _helpers = __webpack_require__(9);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	_http2.default.globalAgent.maxSockets = _https2.default.globalAgent.maxSockets = 50;

	var compileError = function compileError(compilation, error) {
	  compilation.errors.push(new Error(error));
	};

	module.exports = function () {
	  function OSSPlugin() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    _classCallCheck(this, OSSPlugin);

	    var include = options.include,
	        exclude = options.exclude,
	        basePath = options.basePath,
	        directory = options.directory,
	        _options$overwrite = options.overwrite,
	        overwrite = _options$overwrite === undefined ? true : _options$overwrite,
	        _options$basePathTran = options.basePathTransform,
	        basePathTransform = _options$basePathTran === undefined ? _helpers.DEFAULT_TRANSFORM : _options$basePathTran,
	        _options$ossOptions = options.ossOptions,
	        ossOptions = _options$ossOptions === undefined ? {} : _options$ossOptions,
	        _options$ossUploadOpt = options.ossUploadOptions,
	        ossUploadOptions = _options$ossUploadOpt === undefined ? {} : _options$ossUploadOpt;


	    this.uploadOptions = ossUploadOptions;
	    this.isConnected = false;
	    this.basePathTransform = basePathTransform;
	    basePath = basePath ? (0, _helpers.addTrailingOSSSep)(basePath) : '';

	    this.options = {
	      directory: directory,
	      include: include,
	      exclude: exclude,
	      basePath: basePath,
	      overwrite: overwrite
	    };

	    this.clientConfig = ossOptions;
	  }

	  _createClass(OSSPlugin, [{
	    key: 'apply',
	    value: function apply(compiler) {
	      var _this = this;

	      var isDirectoryUpload = !!this.options.directory,
	          hasRequiredOptions = _lodash2.default.every(_helpers.REQUIRED_OSS_OPTS, function (type) {
	        return _this.clientConfig[type];
	      });

	      // Set directory to output dir or custom
	      this.options.directory = this.options.directory || compiler.options.output.path || compiler.options.output.context || '.';

	      compiler.plugin('after-emit', function (compilation, cb) {
	        var error;

	        if (!hasRequiredOptions) {
	          error = 'OSSPlugin: Must provide ' + _helpers.REQUIRED_OSS_OPTS.join(', ');
	        }

	        if (error) {
	          compileError(compilation, error);
	          cb();
	        }

	        _this.connect();

	        if (isDirectoryUpload) {
	          _this.fs = _fs2.default;

	          var dPath = (0, _helpers.addSeperatorToPath)(_this.options.directory);

	          _this.getAllFilesRecursive(dPath).then(function (files) {
	            return _this.handleFiles(files, cb);
	          }).then(function () {
	            return cb();
	          }).catch(function (e) {
	            return _this.handleErrors(e, compilation, cb);
	          });
	        } else {
	          _this.fs = compiler.outputFileSystem.createReadStream ? compiler.outputFileSystem : _fs2.default;

	          _this.getAssetFiles(compilation).then(function (files) {
	            return _this.handleFiles(files);
	          }).then(function () {
	            return cb();
	          }).catch(function (e) {
	            return _this.handleErrors(e, compilation, cb);
	          });
	        }
	      });
	    }
	  }, {
	    key: 'handleFiles',
	    value: function handleFiles(files) {
	      var _this2 = this;

	      return Promise.resolve(files).then(function (files) {
	        return _this2.filterAllowedFiles(files);
	      }).then(function (files) {
	        return _this2.uploadFiles(files);
	      });
	    }
	  }, {
	    key: 'handleErrors',
	    value: function handleErrors(error, compilation, cb) {
	      compileError(compilation, 'OSSPlugin: ' + error);
	      cb();
	    }
	  }, {
	    key: 'getAllFilesRecursive',
	    value: function getAllFilesRecursive(fPath) {
	      return (0, _helpers.getDirectoryFilesRecursive)(fPath);
	    }
	  }, {
	    key: 'addPathToFiles',
	    value: function addPathToFiles(files, fPath) {
	      return files.map(function (file) {
	        return { name: file, path: _path2.default.resolve(fPath, file) };
	      });
	    }
	  }, {
	    key: 'getFileName',
	    value: function getFileName() {
	      var file = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

	      if (_lodash2.default.includes(file, _helpers.PATH_SEP)) return file.substring(_lodash2.default.lastIndexOf(file, _helpers.PATH_SEP) + 1);else return file;
	    }
	  }, {
	    key: 'getAssetFiles',
	    value: function getAssetFiles(_ref) {
	      var assets = _ref.assets;

	      var files = _lodash2.default.map(assets, function (value, name) {
	        return { name: name, path: value.existsAt };
	      });

	      return Promise.resolve(files);
	    }
	  }, {
	    key: 'filterAllowedFiles',
	    value: function filterAllowedFiles(files) {
	      var _this3 = this;

	      return files.reduce(function (res, file) {
	        if (_this3.isIncludeAndNotExclude(file.name) && !_this3.isIgnoredFile(file.name)) {
	          res.push(file);
	        }

	        return res;
	      }, []);
	    }
	  }, {
	    key: 'isIgnoredFile',
	    value: function isIgnoredFile(file) {
	      return _lodash2.default.some(_helpers.UPLOAD_IGNORES, function (ignore) {
	        return new RegExp(ignore).test(file);
	      });
	    }
	  }, {
	    key: 'isIncludeAndNotExclude',
	    value: function isIncludeAndNotExclude(file) {
	      var isExclude,
	          isInclude,
	          _options = this.options,
	          include = _options.include,
	          exclude = _options.exclude;


	      isInclude = include ? include.test(file) : true;
	      isExclude = exclude ? exclude.test(file) : false;

	      return isInclude && !isExclude;
	    }
	  }, {
	    key: 'connect',
	    value: function connect() {
	      if (this.isConnected) {
	        return;
	      }

	      this.client = (0, _aliOss2.default)(this.clientConfig);
	      this.isConnected = true;
	    }
	  }, {
	    key: 'transformBasePath',
	    value: function transformBasePath() {
	      var _this4 = this;

	      return Promise.resolve(this.basePathTransform(this.options.basePath)).then(_helpers.addTrailingOSSSep).then(function (nPath) {
	        return _this4.options.basePath = nPath;
	      });
	    }
	  }, {
	    key: 'uploadFiles',
	    value: function uploadFiles() {
	      var _this5 = this;

	      var files = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	      return this.transformBasePath().then(function () {
	        return Promise.all(files.map(function (file) {
	          return _this5.uploadFile(file.name, file.path).then(function (uploadedFile) {
	            if (uploadedFile) {
	              console.log(file.path + ' uploaded to ' + uploadedFile.name);
	            }
	          }, function (e) {
	            console.error(file.path + ' failed to upload', e);
	          });
	        }));
	      });
	    }
	  }, {
	    key: 'uploadFile',
	    value: function uploadFile(fileName, file) {
	      var Key = this.options.basePath + fileName;
	      var client = this.client;
	      var fs = this.fs;
	      var overwrite = this.options.overwrite;
	      var ossParams = _lodash2.default.mapValues(this.uploadOptions, function (optionConfig) {
	        return _lodash2.default.isFunction(optionConfig) ? optionConfig(fileName, file) : optionConfig;
	      });

	      return (0, _co2.default)(regeneratorRuntime.mark(function _callee() {
	        return regeneratorRuntime.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                if (overwrite) {
	                  _context.next = 10;
	                  break;
	                }

	                _context.prev = 1;
	                _context.next = 4;
	                return client.head(Key);

	              case 4:
	                console.log('skipping upload of ' + file);
	                return _context.abrupt('return');

	              case 8:
	                _context.prev = 8;
	                _context.t0 = _context['catch'](1);

	              case 10:
	                _context.next = 12;
	                return client.putStream(Key, fs.createReadStream(file), ossParams);

	              case 12:
	                return _context.abrupt('return', _context.sent);

	              case 13:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, this, [[1, 8]]);
	      }));
	    }
	  }]);

	  return OSSPlugin;
	}();

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("https");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("path");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("fs");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_7__;

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getDirectoryFilesRecursive = exports.translatePathFromFiles = exports.addSeperatorToPath = exports.addTrailingOSSSep = exports.DEFAULT_TRANSFORM = exports.OSS_PATH_SEP = exports.PATH_SEP = exports.REQUIRED_OSS_OPTS = exports.UPLOAD_IGNORES = undefined;

	var _lodash = __webpack_require__(6);

	var _lodash2 = _interopRequireDefault(_lodash);

	var _path = __webpack_require__(4);

	var _path2 = _interopRequireDefault(_path);

	var _recursiveReaddir = __webpack_require__(10);

	var _recursiveReaddir2 = _interopRequireDefault(_recursiveReaddir);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var UPLOAD_IGNORES = exports.UPLOAD_IGNORES = ['.DS_Store'];

	var REQUIRED_OSS_OPTS = exports.REQUIRED_OSS_OPTS = ['region', 'accessKeyId', 'accessKeySecret', 'bucket'];
	var PATH_SEP = exports.PATH_SEP = _path2.default.sep;
	var OSS_PATH_SEP = exports.OSS_PATH_SEP = '/';
	var DEFAULT_TRANSFORM = exports.DEFAULT_TRANSFORM = function DEFAULT_TRANSFORM(item) {
	  return Promise.resolve(item);
	};

	var addTrailingOSSSep = exports.addTrailingOSSSep = function addTrailingOSSSep(fPath) {
	  return fPath ? fPath.replace(/\/?(\?|#|$)/, '/$1') : fPath;
	};

	var addSeperatorToPath = exports.addSeperatorToPath = function addSeperatorToPath(fPath) {
	  if (!fPath) {
	    return fPath;
	  }

	  return _lodash2.default.endsWith(fPath, PATH_SEP) ? fPath : fPath + PATH_SEP;
	};

	var translatePathFromFiles = exports.translatePathFromFiles = function translatePathFromFiles(rootPath) {
	  return function (files) {
	    return _lodash2.default.map(files, function (file) {
	      return {
	        path: file,
	        name: file.replace(rootPath, '').split(PATH_SEP).join(OSS_PATH_SEP)
	      };
	    });
	  };
	};

	var getDirectoryFilesRecursive = exports.getDirectoryFilesRecursive = function getDirectoryFilesRecursive(dir) {
	  var ignores = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	  return new Promise(function (resolve, reject) {
	    (0, _recursiveReaddir2.default)(dir, ignores, function (err, files) {
	      return err ? reject(err) : resolve(files);
	    });
	  }).then(translatePathFromFiles(dir));
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_10__;

/***/ }
/******/ ])
});
;