const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3 } = require("../config/aws.config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const uploadFileToS3 = (folderName) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      acl: "public-read",
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const uniqueSuffix = Date.now().toString() + "-" + file.originalname;
        const fullKey = folderName
          ? `${folderName}/${uniqueSuffix}`
          : uniqueSuffix;
        cb(null, fullKey);
      },
    }),
  });
};

const deleteFileFromS3 = async (key) => {
  const bucketParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  };
  try {
    await s3.send(new DeleteObjectCommand(bucketParams));
    console.log(`File ${key} deleted successfully`);
  } catch (err) {
    console.error(`Error deleting file ${key}:`, err);
    throw err;
  }
};

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
};
