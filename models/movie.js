const mongoose = require('mongoose')
const Schema = mongoose.Schema

const movieSchema = new Schema({
  name: String,
  genre: String,
  rate: Number,
  watched: Boolean,
  directorId: String,
}, { collection: 'movies' })

module.exports = mongoose.model('Movie', movieSchema)