const { gql } = require('apollo-server-express');

const schema = gql(`
  type User {
    id: ID!
    username: String!
    email: String!
    contact: [ID]
  }

  input UserInput {
    username: String!
    email: String!
    password: String!
    contact: [ID]
  }

  input Login {
    email: String!
    password: String!
  }

  type Chat {
    id: ID!
    message: String!
    sender: User!
    receiver: User!
    createdAt: String!
  }

  type AuthPayload {
    id: ID!
    username: String!
    email: String!
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  type Query {
    users: [User]
    chats: [Chat]
  }

  type Mutation {
    createUser(input: UserInput): User
    login(input: Login): AuthPayload
    sendMessage(message: String!, senderId: ID!, receiverId: ID!): Chat
    editMessage(id: ID!, newMessage: String!): Chat
    deleteMessage(id: ID!): DeleteResponse
  }

  type Subscription {
    messageSent: Chat!
  }
`);

module.exports = schema;
