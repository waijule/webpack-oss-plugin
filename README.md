
OSS Plugin
==========
[![Travis Badge](https://travis-ci.org/waijule/webpack-oss-plugin.svg?branch=master)](https://travis-ci.org/waijule/webpack-oss-plugin)

This plugin will upload all built assets to OSS


### Install Instructions

```bash
$ npm i webpack-oss-plugin
```
Note: This plugin needs NodeJS > 0.12.0

### Usage Instructions
> I notice a lot of people are setting the directory option when the files are part of their build. Please don't set   directory if your uploading your build. Using the directory option reads the files after compilation to upload instead of from the build process.

##### Require `webpack-oss-plugin`
You will need babel-polyfill to use this plugin

```javascript
var OSSPlugin = require('webpack-oss-plugin')
```

##### With exclude
```javascript
var config = {
  plugins: [
    new OSSPlugin({
      // Exclude uploading of html
      exclude: /.*\.html$/,
      // ossOptions are required
      ossOptions: {
        accessKeyId: process.env.OSS_ACCESS_KEY,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        region: 'oss-cn-shanghai',
        bucket: process.env.OSS_BUCKET,
      },
      ossUploadOptions: {
      }
    })
  ]
}
```

##### With include
```javascript
var config = {
  plugins: [
    new OSSPlugin({
      // Only upload css and js
      include: /.*\.(css|js)/,
      // ossOptions are required
      ossOptions: {
        accessKeyId: process.env.OSS_ACCESS_KEY,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        region: 'oss-cn-shanghai',
        bucket: process.env.OSS_BUCKET,
      },
      ossUploadOptions: {
      }
    })
  ]
}
```

##### With basePathTransform
```javascript
import gitsha from 'gitsha'

var addSha = function() {
  return new Promise(function(resolve, reject) {
    gitsha(__dirname, function(error, output) {
      if(error)
        reject(error)
      else
       // resolve to first 5 characters of sha
       resolve(output.slice(0, 5))
    })
  })
}

var config = {
  plugins: [
    new OSSPlugin({
      ossOptions: {
        accessKeyId: process.env.OSS_ACCESS_KEY,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        region: 'oss-cn-shanghai',
        bucket: process.env.OSS_BUCKET,
      },
      ossUploadOptions: {
      }
      basePathTransform: addSha
    })
  ]
}


// Will output to /${mySha}/${fileName}
```

##### With Dynamic Upload Options
```javascript
var config = {
  plugins: [
    new OSSPlugin({
      ossOptions: {
        accessKeyId: process.env.OSS_ACCESS_KEY,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        region: 'oss-cn-shanghai',
        bucket: process.env.OSS_BUCKET,
      },
      ossUploadOptions: {
        headers(fileName) {
          return {
            'Cache-Control': 'max-age=31536000'
          };
        },
      }
    })
  ]
}
```

### Options

- `exclude`: Regex to match for excluded content
- `include`: Regex to match for included content
- `overwrite`: false will skip uploading if file already exists in oss. Default true
- `ossOptions`: Provide keys for upload extention of [ossConfig](https://github.com/ali-sdk/ali-oss#ossoptions)
- `ossUploadOptions`: Provide upload options [put](https://github.com/ali-sdk/ali-oss#putname-file-options)
- `basePath`: Provide the namespace where upload files on OSS
- `basePathTransform`: transform the base path to add a folder name. Can return a promise or a string

### Contributing
All contributions are welcome. Please make a pull request and make sure things still pass after running `npm run test`
For tests you will need to either have the environment variables set or setup a .env file. There's a .env.sample so you can `cp .env.sample .env` and fill it in. Make sure to add any new environment variables.

#### Commands to be aware of
###### *WARNING*: The test suit generates random files for certain checks. Ensure you delete files leftover on your Bucket.
- `npm run test` - Run test suit (You must have the .env file setup)
- `npm run build` - Run build

#### Publish
- `npm run prep:patch` - Prepare for patch release
- `npm run prep:minor` - Prepare for minor release
- `npm run prep:major` - Prepare for major release
Push a tag will automatically publish a version to NPM by travis

#### Thanks
Thanks to [s3-plugin-webpack](https://github.com/MikaAK/s3-plugin-webpack)
