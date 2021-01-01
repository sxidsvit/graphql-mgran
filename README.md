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
