const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const schema = require('../schema/schema')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
const PORT = 3021
mongoose.connect('mongodb+srv://sxidsvit:1234qwer@cluster0.b7vva.azure.mongodb.net/graphql-tutorial?authSource=admin&replicaSet=atlas-umab7t-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

app.use(cors())

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}))


const db = mongoose.connection;
db.on('error', err => console.log(`DB connection error: ${err}`))
db.once('open', () => console.log('Connected to DB!'))

app.listen(PORT, err => {
  err ? console.log(error) : console.log(`Server started at port ${PORT}`)
})