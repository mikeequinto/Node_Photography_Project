require('dotenv').config()

const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')
const sharp = require('sharp')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})


// Upload original file to s3
async function uploadFile(file, resize) {

    if (resize) {
        await sharp(file.path).resize({ height: 200} )
        .toFile('uploads/output.jpg')
        .then( info => {

            console.log(info);
            const fileStream = fs.createReadStream(`${file.destination}output.jpg`)

            const uploadParams = {
                Bucket: bucketName,
                Body: fileStream,
                Key: `resized/${file.filename}`
            }
    
            return s3.upload(uploadParams).promise()
            
        }).catch(err => {
            console.log(err);
        })

    } else {

        const fileStream = fs.createReadStream(file.path)

        const uploadParams = {
            Bucket: bucketName,
            Body: fileStream,
            Key: `original/${file.filename}`
        }

        return s3.upload(uploadParams).promise()
    }
}
exports.uploadFile = uploadFile


// Download file from s3
function getFileStream(fileKey, resize) {

    const downloadParams = {
        Key: resize === 'true' ? `resized/${fileKey}` : `original/${fileKey}`,
        Bucket: bucketName
    }

    return s3.getObject(downloadParams).promise()
}
exports.getFileStream = getFileStream