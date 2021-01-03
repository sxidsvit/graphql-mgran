## Серверная часть

### Установка зависимостей

- Для сервера: npm i express nodemon graphql express-graphql mongoose cors --save
- Для приложения (UI): yarn add apollo-boost react-apollo graphql @material-ui/core @material-ui/icons react-swipeable-views recompose

Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the books

---

```js
const graphqlHTTP = require('express-graphql')
```

Теперь express-сервер можем использовать GraphQL API для обработки запросов, которые приходят на адресс /graphql. Реализуется это как middleware

---

### GraphQL cхема и Query-запросы

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
  'mongodb+srv://sxidsvit:1234qwer@cluster0.b7vva.azure.mongodb.net/graphql-tutorial?authSource=admin&replicaSet=atlas-umab7t-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true',
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

---

### Схема со всеми мутациями

```js
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addDirector: {
      type: DirectorType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        age: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve(parent, args) {
        const director = new Directors({
          name: args.name,
          age: args.age,
        })
        return director.save()
      },
    },
    addMovie: {
      type: MovieType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLNonNull(GraphQLString) },
        directorId: { type: GraphQLID },
      },
      resolve(parent, args) {
        const movie = new Movies({
          name: args.name,
          genre: args.genre,
          directorId: args.directorId,
        })
        return movie.save()
      },
    },
    deleteDirector: {
      type: DirectorType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Directors.findByIdAndRemove(args.id)
      },
    },
    deleteMovie: {
      type: MovieType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Movies.findByIdAndRemove(args.id)
      },
    },
    updateDirector: {
      type: DirectorType,
      args: {
        id: { type: GraphQLID },
        name: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve(parent, args) {
        return Directors.findByIdAndUpdate(
          args.id,
          { $set: { name: args.name, age: args.age } },
          { new: true }
        )
      },
    },
    updateMovie: {
      type: MovieType,
      args: {
        id: { type: GraphQLID },
        name: { type: GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLNonNull(GraphQLString) },
        directorId: { type: GraphQLID },
      },
      resolve(parent, args) {
        return Movies.findByIdAndUpdate(
          args.id,
          {
            $set: {
              name: args.name,
              genre: args.genre,
              directorId: args.directorId,
            },
          },
          { new: true }
        )
      },
    },
  },
})

module.exports = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
})
```

---

## Клиентская часть приложения (React и Apollo)

```js
npm install apollo-boost react-apollo graphql @material-ui/core @material-ui/icons react-swipeable-views recompose
```

Recompose is a React utility belt for function components and higher-order component. Он позволяет обернуть один компонент в НЕСКОЛЬКО HOC-компонентов.

---

Все созданные компогненты находятся в папке /application/src/components

Во многих папках с компонентами есть hoc-файл с содержимым

```js
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'recompose'

import { styles } from './styles'

export default compose(withStyles(styles))
```

Это решение от Material UI позволяет преобразовывать файл со стилями для данного компонента в объект и поместить его во внуть главного компонента как props. Теперь использование стилей становиться более удобным.

Например, файл /Tabs/TabsHoc.js

```js
...
import withHocs from './Tabs.jsx'
...
export default withHocs(SimpleTabs)

```

---

Настроим наше package.json Так, чтобы сервер и приложение можно было запускать одной командой

app.js подкючаем middleware cors чтобы сделать возможным обработку CORS-запросов

```js
const cors = require('cors')
...
// сначала подключаем cors !!!
app.use(cors())
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}))
```

Подключаем клиент /application/src/App.js

```js
...
import ApolloClient, { InMemoryCache } from 'apollo-boost'
import { ApolloProvider } from 'react-apollo'

const cache = new InMemoryCache()

const client = new ApolloClient({
  cache,
  uri: 'http://localhost:3021/graphql',
})

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <MuiThemeProvider theme={theme}>
          <Tabs />
        </MuiThemeProvider>
      </ApolloProvider>
    )
  }
}
```

Подготывливаем тестовый запрос /src/MovieTable

```js
// queries.js
import { gql } from 'apollo-boost'

export const moviesQuery = gql`
  query movieQuery {
    movies {
      id
      name
      genre
    }
  }
`

// MoviesTableHoc.js - создаем оберку,
// чтобы передать в props стили и результат graphql-запроса
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'
import { moviesQuery } from './queries'
import { styles } from './styles'

export default compose(withStyles(styles), graphql(moviesQuery))

// MoviesTable.jsx - тестируем получение данных с сервера
import withHocs from './MoviesTableHoc';
...
  render() {
...
    console.log(this.props.data)
...
export default withHocs(MoviesTable)
```

---

Добавление нового поля в существующий тип

```js
// models/movie.js
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const movieSchema = new Schema(
  {
    name: String,
    genre: String,
    rate: Number,
    watched: Boolean,
  },
  { collection: 'movies' }
)
module.exports = mongoose.model('Movie', movieSchema)

// schema/schema.js
const MovieType = new GraphQLObjectType({
  name: 'Movie',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLNonNull(GraphQLString) },
    genre: { type: GraphQLNonNull(GraphQLString) },
    watched: { type: GraphQLNonNull(GraphQLBoolean) },
    rate: { type: GraphQLInt },
    director: {
      type: DirectorType,
      resolve(parent, args) {
        // return directors.find(d => d.id === parent.id);
        return Directors.findById(parent.directorId)
      },
    },
  }),
})
...
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addMovie: {
      type: MovieType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLNonNull(GraphQLString) },
        directorId: { type: GraphQLID },
        watched: { type: new GraphQLNonNull(GraphQLBoolean) },
        rate: { type: GraphQLInt },
      },
      resolve(parent, { name, genre, directorId, watched, rate }) {
        const movie = new Movies({
          name,
          genre,
          directorId,
          watched,
          rate
        });
        return movie.save();
      }
    },
    updateMovie: {
      type: MovieType,
      args: {
        id: { type: GraphQLID },
        name: { type: GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLNonNull(GraphQLString) },
        directorId: { type: GraphQLID },
        watched: { type: new GraphQLNonNull(GraphQLBoolean) },
        rate: { type: GraphQLInt },
      },
      resolve(parent, { id, name, genre, directorId, watched, rate }) {
        return Movies.findByIdAndUpdate(
          args.id,
          {
            $set: { name, genre, directorId, watched, rate }
          },
          { new: true }
        )
      }
    }
  },
}),

```

---

### HOC: подключение стилей и серверных данных через props

Настраиваем компоненты, ответственными за отображение вкладок с фильмами и режисёрами (/components/DirectorsTable & /components/MoviessTable), для получения данных с сервера.

Вот как это выглидит для компонетна DirectorsTable

```js
// src/components/DirectorsTable/queries.js
import { gql } from 'apollo-boost'

export const directorsQuery = gql`
query directorsQuery {
  directors{
    id
    name
    age
    movies{
      name
      id
    }
  }
}
```

```js
//  src/components/DirectorsTable/DirectorsTableHoc.js
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'
import { directorsQuery } from './queries'

import { styles } from './styles'

// wrapers over styles & queries' results
export default compose(withStyles(styles), graphql(directorsQuery))
```

```js
//  src/components/DirectorsTable/DirectorsTable.jsx
import withHocs from './DirectorsTableHoc';

class DirectorsTable extends React.Component {
  ...
  render() {
    const { anchorEl, openDialog, data: activeElem = {} } = this.state;
    const { classes, data = {} } = this.props
    const { directors = [] } = data
  ...
 }
export default withHocs(DirectorsTable)
```

---

### HOC: добавление нового режисера

Настраиваем компонент DirectorsForm, ответственный за отображение формы в которую вводим имя и возраст режисёра. Далее, вызывается мутация и данные обновляются на сервере и на клиенте

```js
// src/components/DirectorsForm/mutations.js
import { gql } from 'apollo-boost'

export const addDirectorMutation = gql`
  mutation addDirector($name: String!, $age: Int!) {
    addDirector(name: $name, age: $age) {
      name
    }
  }
`

// src/components/DirectorsForm/DirectorsFormHoc.js
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'
import { addDirectorMutation } from './mutations'
import { directorsQuery } from '../DirectorsTable/queries'
import { styles } from './styles'

const withGraphqlAdd = graphql(addDirectorMutation, {
  props: ({ mutate }) => ({
    addDirector: (director) =>
      mutate({
        variables: director,
        refetchQueries: [{ query: directorsQuery }],
      }),
  }),
})

export default compose(withStyles(styles), withGraphqlAdd)

// src/components/DirectorsForm/DirectorsForm.js
...
import withHocs from './DirectorsFormHoc';

class DirectorsForm extends React.Component {
...
  handleSave = () => {
    const { selectedValue, onClose, addDirector } = this.props;
    const { id, name, age } = selectedValue;
    addDirector({ name, age: Number(age) })
    onClose();
  };
...
}

export default withHocs(DirectorsForm);
```

_Нам не только нужно вызвать mutation, но также после её завершения отправить query на обновление данных во вкладке с режисерами. Всё это сделает функция graphql() в src/components/DirectorsForm/DirectorsFormHoc.js_

Всё тоже самое нужно проделать и с компонентом src/components/MoviesForm, которой добавляет новые фильмы в нашу БД

```js
// src/components/MoviesForm/mutations.js
import { gql } from 'apollo-boost'

export const addMovieMutation = gql`
  mutation addMovie(
    $name: String!
    $genre: String!
    $watched: Boolean!
    $rate: Int
    $directorId: ID
  ) {
    addMovie(
      name: $name
      genre: $genre
      watched: $watched
      rate: $rate
      directorId: $directorId
    ) {
      name
    }
  }
`
```

```js
// src/components/MoviesForm/queries.js
// Этот query нужен для вывода списка режисёров в форму
import { gql } from 'apollo-boost'

export const moviesQuery = gql`
  query movieQuery {
    movies {
      id
      name
      genre
      rate
      watched
      director {
        name
      }
    }
  }
`
```

```js
// src/components/MoviesForm/MoviesFormHoc.js
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'

import { addMovieMutation } from './mutations'
import { moviesQuery } from '../MoviesTable/queries'
import { directorsQuery } from './queries'

import { styles } from './styles'

const withGraphqlAdd = graphql(addMovieMutation, {
  props: ({ mutate }) => ({
    addMovie: (movie) =>
      mutate({
        variables: movie,
        refetchQueries: [{ query: moviesQuery }],
      }),
  }),
})

export default compose(
  withStyles(styles),
  withGraphqlAdd,
  graphql(directorsQuery)
)
```

```js
// src/components/MoviesForm/MoviesForm.js
...
import withHocs from './MoviesFormHoc';

class MoviesForm extends React.Component {
  handleClose = () => { this.props.onClose()};

  handleSave = () => {
    const { selectedValue, onClose, addMovie } = this.props;
    const { id, name, genre, rate, directorId, watched } = selectedValue;
    addMovie({ id, name, genre, rate: Number(rate), directorId, watched: Boolean(watched) });
    onClose()
  };

  render() {
    const { classes, open, handleChange, handleSelectChange, handleCheckboxChange, selectedValue = {}, data = {} } = this.props;
    const { name, genre, rate, directorId, watched } = selectedValue;
    const { directors = [] } = data // для списка режисёров

...
     <Select
        value={directorId}
        onChange={handleSelectChange}
        input={<OutlinedInput name="directorId" id="outlined-director" labelWidth={57} />}
      >
        {directors.map(director => <MenuItem key={director.id} value={directid}>{director.name}</MenuItem>)}
      </Select>
...
}
export default withHocs(MoviesForm)

```

---

Теперь у нашего приложения есть возможность не только просматривать списки фильмов и режисёров, но и добавлять в них новые записи (документы)

---
