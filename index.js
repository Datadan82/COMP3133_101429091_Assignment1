require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

async function startServer() {
  connectDB();

  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors({
      origin: [
        'http://localhost:4200',
        'https://101429091-comp3133-assignment2-wkcv.vercel.app'
      ],
      credentials: true
    }),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req })
    })
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer();
