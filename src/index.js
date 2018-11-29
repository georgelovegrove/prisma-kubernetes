require('dotenv').config()

const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const { ApolloEngine } = require('apollo-engine')

const resolvers = require('./resolvers')

const prisma = new Prisma({
  typeDefs: 'src/generated/prisma.graphql',
  endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma DB service (value is set in .env)
  secret: process.env.PRISMA_SECRET, // taken from database/prisma.yml (value is set in .env)
  debug: false, // log all GraphQL queries & mutations
})

const server = new GraphQLServer({
  typeDefs: 'src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: prisma
  })
})

const engine = new ApolloEngine({
  apiKey: process.env.APOLLO_ENGINE_KEY,
})

const httpServer = server.createHttpServer({
  tracing: true,
  cacheControl: true,
})

const port = process.env.PORT || 4000

engine.listen(
  {
    port,
    httpServer,
    graphqlPaths: ['/'],
  },
  () =>
    console.log(`Server with Apollo Engine is running on ${port}`)
)
