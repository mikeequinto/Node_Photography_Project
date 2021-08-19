const mongoose = require ('mongoose')

const Schema = mongoose.Schema;
const albumSchema = new Schema({
    name: String,
    description: String,
    key: String
})

module.exports = mongoose.model('album', albumSchema, 'albums')