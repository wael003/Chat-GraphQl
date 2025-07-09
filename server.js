const { ApolloServer } = require('apollo-server-express');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const express = require('express');
const typeDefs = require('./graphql/shema');
const resolvers = require('./graphql/resolver');
const cookieParser = require('cookie-parser');
const DB = require('./config/DB');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

// Connect to DB
DB();

// Initialize Express
const app = express();
app.use(cookieParser());
app.use(authMiddleware);

// Create the HTTP server
const httpServer = createServer(app);

// Create GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Apollo Server
const server = new ApolloServer({
    schema,
    context: ({ req, res }) => {
        return { req, res, user: req.user };
    }
});

// Start Apollo Server
async function startServer() {
    await server.start();
    server.applyMiddleware({ app, cors: { origin: 'http://localhost:3000', credentials: true } });

    // Create WebSocket server
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: server.graphqlPath,
    });

    useServer({
        schema,
        context: async (ctx, msg, args) => {
            // You can pass auth info here later
            return { user: null };
        }
    }, wsServer);

    httpServer.listen(4000, () => {
        console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
        console.log(`📡 Subscriptions ready at ws://localhost:4000${server.graphqlPath}`);
    });
}

startServer();
