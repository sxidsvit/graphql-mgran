const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MovieSchema = new Schema({
  name: String,
  genre: String,
  directorId: String,
})

module.exports = mongoose.model('Movies', MovieSchema)