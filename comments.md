## Установка зависимостей

- Для сервера: npm i express nodemon graphql express-graphql mongoose cors --save
- Для приложения (UI): yarn add apollo-boost react-apollo graphql @material-ui/core @material-ui/icons react-swipeable-views recompose

Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the books

---

```js
const graphqlHTTP = require('express-graphql')
```

Теперь express-сервер можем использовать GraphQL API для обработки запросов, которые приходят на адресс /graphql. Реализуется это как middleware

---

Есть отличие в описании типов данных и запросов с файле schema.js и книге ["GraphQL: язык запросов для современных веб-приложений"](https://www.htbook.ru/kompjutery_i_seti/programmirovanie/graphql-yazyk-zaprosov-dlya-sovremennyh-veb-prilozhenij)

В книге мы используем Apollo-server

```js
// 1. Требуется 'apollo-server'.
const { ApolloServer } = require('apollo-server')
const typeDefs = `
type Query {
totalPhotos: Int!
}
`
const resolvers = {
  Query: {
    totalPhotos: () => 42,
  },
}
// 2. Создаем новый экземпляр сервера.
// 3. Отправляем ему объект с typeDefs (схема) и resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
})
// 4. Вызываем отслеживание на сервере для запуска веб-сервера.
server.listen().then(({ url }) =>
  console.log(`GraphQL Service running
on ${url}`)
)
```

В нашем случае файле /schema/schema.js используем библиотеку the JavaScript reference implementation for GraphQL, поэтому файл выглидят так

```js
const graphql = require('graphql')

const { GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql

const MovieType = new GraphQLObjectType({
  name: 'Movie',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    genre: { type: GraphQLString },
  }),
})

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    movie: {
      type: MovieType,
      args: { id: { type: GraphQLString } },
      resolve(parent, args) {},
    },
  },
})

module.exports = new GraphQLSchema({
  query: Query,
})
```

---

Если мы делаем схемы с ссылками друг на друга, то должны обеспечить т.н. ленивую подгузку полей. Для этого поле fields при объвлении пользовательского типа должно содержать функцию

```js
const MovieType = new GraphQLObjectType({
  name: 'Movie',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    genre: { type: GraphQLString },
    director: {
      type: DirectorType,
      resolve(parent, args) {
        return directors.find((d) => d.id === parent.id)
      },
    },
  }),
})
```

---

### Мутации

#### [Сервис mLab](https://mlab.com/)

mLab is now part of the MongoDB family

If you're looking for a cloud-hosted MongoDB service similar to mLab, sign up for MongoDB Atlas, a fully-managed database-as-a-service available on AWS, Azure, and GCP

Поскольку сервис mLab использует MongoDB, то мне удобней работать с [Atlas](https://cloud.mongodb.com/)

Создаю БД graphql-tutorials и в ней две коллекции: movies & directors.
После чего переношу в них данные из локального файла.

Для этой цели удобно использовать [MongoDB Compass](https://metanit.com/nosql/mongodb/1.3.php) - клиент, разработанный MongoDB Inc для администрирования и просмотра данных на локальном компьютере

---

Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment. Mongoose supports both promises and callbacks

C помощью [Mongoose](https://www.npmjs.com/package/mongoose) создаем схемы для фильмов и режисёров. Схема преобразовывается в объект, который обладает набором методов, позволяющих взаимодействовать с MongoDB. Эти методы в дальнейшем будем использовать в resolvers.

Создаём файл со схемой для фильмов - /model/movie.js

```js
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MovieSchema = new Schema({
  name: String,
  genre: String,
  directorId: String,
})

module.exports = mongoose.model('Director', MovieSchema)
```

и файл со схемой для режисёров - /model/director.js

```js
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DirectorSchema = new Schema({
  name: String,
  age: Number,
})

module.exports = mongoose.model('Director', DirectorSchema)
```

Поскольку теперь мы работаем с базой MongoDBб нам нужно изменить конфигурацию сервера (импортировать в него mongoose)

Чтобы работать с БД нужно иметь хотябы одного пользователя.
Имя и пароль пользователя используется в строке подключения к серверу MongoDB

```js
const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const schema = require('../schema/schema')
const mongoose = require('mongoose')

const app = express()
const PORT = 3021
mongoose.connect(
  'mongodb+srv://sxidsvit:1234qwer@cluster0.b7vva.azure.mongodb.net/test?authSource=admin&replicaSet=atlas-umab7t-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true',
  { useNewUrlParser: true, useUnifiedTopology: true }
)

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
  })
)

const dbConnection = mongoose.connection
dbConnection.on('error', (err) => console.log(`Connection error: ${err}`))
dbConnection.once('open', () => console.log('Connected to DB!'))

app.listen(PORT, (err) => {
  err ? console.log(error) : console.log(`Server started at port ${PORT}`)
})
```

К серверу MongoDB мы подключились

---

- Создаём модели /models/director.js и /models/movie.js

```js
mongoose.model('Movie', movieSchema)

mongoose.model('Director', directorSchema)
```

Первый параметр в методе mongoose.model указывает на название модели. Mongoose затем будет автоматически искать в базе данных коллекцию, название которой соответствует названию модели [во множественном числе](https://metanit.com/web/nodejs/6.6.php). Например, в данном случае название модели "Director". Во множественном числе в соответствии с правилами английского языка это "directors". Поэтому при работе с данными модели Director (добавлении, удалении, редактировании и получении объектов) mongoose будет обращаться к коллекции "directors". Если такая коллекция есть в БД, то с ней будет идти взаимодействие. Если такой коллекции в базе данных нет, то она будет создана автоматически

- Подключаем схемы в файл /schema/schema.js

```js
const Movies = require('../models/movies')
const Directors = require('../models/director')
```

- Теперь нужно подправить резолверы с учётом синтаксиса MongoDB:

```js
   resolve(parent, args) {
     // return directors.find(d => d.id === parent.id);
     return Directors.findById(parent.directorId);
   }

   resolve(parent, args) {
     // return movies.filter(m => m.directorId = parent.id)
     return Movies.find({ directorId: parent.id });
   }

   resolve(parent, args) {
     // return directors.find(d => d.id === args.id);
     return Directors.findById(args.id);
   },

   resolve(parent, args) {
     // return movies.find(m => m.id == args.id)
     return Movies.findById(args.id);
   },

   resolve(parent, args) {
     // return directors
     return Directors.find({});
   },

   resolve(parent, args) {
     // return movies
     return Movies.find({});
   }

```
