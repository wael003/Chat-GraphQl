const User = require('../models/User.js');
const Chat = require('../models/Chat.js');
const jwt = require('jsonwebtoken');
const pubsub = require('../utils/PubSub.js');

const MESSAGE_SENT = 'MESSAGE_SENT';

module.exports = {
  Query: {
    users: async () => await User.find(),
    chats: async () => await Chat.find(),
  },

  Mutation: {
    createUser: async (_, { input }) => {
      try {
        const user = new User({ ...input });
        await user.save();
        return user;
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error('Failed to create user');
      }
    },

    login: async (_, { input }, { res }) => {
      const { email, password } = input;

      if (!email || !password) {
        throw new Error("Email or password missing");
      }

      const user = await User.findOne({ email });

      if (!user) {
        throw new Error("User not found");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

      res.cookie("token", token, {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        secure: false, // true إذا كنت تستخدم HTTPS فقط
      });

      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      };
    },

    sendMessage: async (_, { message, senderId, receiverId }, { user }) => {
      if (!user) throw new Error('Unauthorized');

      const sender = await User.findById(senderId);
      const isFind = sender.contact.find(f => f.equals(receiverId));

      if (!isFind) {
        throw new Error("You need to send request to invite!");
      }

      const chat = new Chat({
        message,
        sender: senderId,
        receiver: receiverId
      });

      const savedChat = await chat.save();

      const populatedChat = await Chat.findById(savedChat._id)
        .populate('sender')
        .populate('receiver')
        .lean();

      if (populatedChat.sender?._id) {
        populatedChat.sender.id = populatedChat.sender._id.toString();
      }

      if (populatedChat.receiver?._id) {
        populatedChat.receiver.id = populatedChat.receiver._id.toString();
      }

      populatedChat.createdAt = populatedChat.sentAt;

      pubsub.publish(MESSAGE_SENT, {
        messageSent: populatedChat,
        receiverId: populatedChat.receiver.id
      });

      return populatedChat;
    },

    editMessage: async (_, { id, newMessage }, { user }) => {
      if (!user) throw new Error('Unauthorized');

      const messageInfo = await Chat.findById(id);
      if (!messageInfo) throw new Error('Message not found');

      if (user.id !== messageInfo.sender.toString()) {
        throw new Error('Unauthorized: not the sender');
      }

      if (!newMessage) {
        throw new Error('You must write a new message');
      }

      const updatedMessage = await Chat.findByIdAndUpdate(
        id,
        { message: newMessage },
        { new: true }
      );

      if (!updatedMessage) {
        throw new Error('There is no message to edit!');
      }

      return updatedMessage;
    },

    deleteMessage: async (_, { id }, { user }) => {
      if (!user) throw new Error('Unauthorized');

      const messageInfo = await Chat.findById(id);
      if (!messageInfo) throw new Error('Message not found');

      if (user.id !== messageInfo.sender.toString()) {
        throw new Error('Unauthorized: not the sender');
      }

      await Chat.findByIdAndDelete(id);

      return {
        success: true,
        message: "Message deleted successfully"
      };
    },
   
  },
   Subscription: {
      messageSent: {
        subscribe: (_, { receiverId }) =>
          pubsub.asyncIterator(MESSAGE_SENT),
        resolve: (payload, args) => {
          if (payload.receiverId !== args.receiverId) {
            return null;
          }
          return payload.messageSent;
        },
      }
    }
}
  
