import dotenv from 'dotenv'

dotenv.load();

const {
  OSS_BUCKET,
  OSS_REGION,
  OSS_ACCESS_KEY,
  OSS_ACCESS_KEY_SECRET,
} = process.env;

export default {
  OSS_BUCKET,
  OSS_REGION,
  OSS_ACCESS_KEY,
  OSS_ACCESS_KEY_SECRET,

  ossOptions: {
    accessKeyId: OSS_ACCESS_KEY,
    accessKeySecret: OSS_ACCESS_KEY_SECRET,
    region: OSS_REGION,
    bucket: OSS_BUCKET,
  },

  ossUploadOptions: {
  },
}
