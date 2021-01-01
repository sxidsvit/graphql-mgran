const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DirectorSchema = new Schema({
  name: String,
  age: Number
})

module.exports = mongoose.model('Directors', DirectorSchema)