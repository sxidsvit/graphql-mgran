const graphql = require('graphql')

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLBoolean
} = graphql

const Movies = require('../models/movie')
const Directors = require('../models/director')

// Custom data types
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
        return Directors.findById(parent.directorId);
      }
    }
  }),
})

const DirectorType = new GraphQLObjectType({
  name: 'Director',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLNonNull(GraphQLString) },
    age: { type: GraphQLNonNull(GraphQLInt) },
    movies: {
      type: new GraphQLList(MovieType),
      resolve(parent, args) {
        // return movies.filter(m => m.directorId = parent.id)
        return Movies.find({ directorId: parent.id })
      }
    }
  }),
})

//  Custom queries

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    movie: {
      type: MovieType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        // return movies.find(m => m.id == args.id)
        return Movies.findById(args.id);
      },
    },
    director: {
      type: DirectorType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        // return directors.find(d => d.id === args.id);
        return Directors.findById(args.id);
      },
    },
    movies: {
      type: new GraphQLList(MovieType),
      resolve(parent, args) {
        // return movies
        return Movies.find({})
      }
    },
    directors: {
      type: new GraphQLList(DirectorType),
      resolve(parent, args) {
        // return directors
        return Directors.find({});
      }
    }
  }
})

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
      }
    },
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
    deleteDirector: {
      type: DirectorType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Directors.findByIdAndRemove(args.id);
      }
    },
    deleteMovie: {
      type: MovieType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Movies.findByIdAndRemove(args.id);
      }
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
          { new: true },
        );
      },
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
  }
})

module.exports = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
})