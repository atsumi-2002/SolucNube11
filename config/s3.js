require('dotenv').config()
const AWS = require('aws-sdk')

AWS.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION,
});

console.log("Conectado a S3!!!")
module.exports = {AWS}