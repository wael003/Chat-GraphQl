const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const typeDefs = require('./graphql/shema');
const resolvers = require('./graphql/resolver');
const cookieParser = require('cookie-parser');
const DB = require('./config/DB');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

DB();

const app = express();
app.use(cookieParser());
app.use(authMiddleware);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    credentials: 'include', 
    context: ({ req, res }) => {
        return { req, res ,user : req.user}; 
    }
});

server.start().then(() => {
    server.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log('Server ready at http://localhost:4000/graphql');
    });
});
