const mongoose = require ('mongoose')

const Schema = mongoose.Schema;
const pictureSchema = new Schema({
    key: { type: String, required: true },
    album: { type: String, required: true },
})

module.exports = mongoose.model('picture', pictureSchema, 'pictures')