import { makeExecutableSchema } from '@graphql-tools/schema';
import { AuthenticationError } from 'apollo-server';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import fs from 'fs';
import { PubSub } from 'graphql-subscriptions';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Context } from './types/contenxt';
import {
  QueryResolvers,
  Resolvers,
  SubscriptionResolvers,
} from './types/generated/graphql';

const subscribeTypes = {
  NUMBER_INCREMENTED: 'NUMBER_INCREMENTED',
};

let currentNumber = 0;
const PORT = 4000;
const pubsub = new PubSub();

// サンプルデータ
const sampleBooks = [
  { title: 'The Awakening', author: 'Kate Chopin' },
  { title: 'City of Glass', author: 'Paul Auster' },
  { title: 'Human Disqualification', author: 'Osamu Dazai' },
];

// NOTE: graphql.codegen によって片付けされたものと同じものを読み込むことができる
const typeDefs = fs.readFileSync('./schema.graphql', { encoding: 'utf8' });

// QueryResolver(HTTP)の定義
const queryResolvers: QueryResolvers<Context> = {
  books: (parent, args, context: Context) => {
    // TODO: 認可処理を入れる
    // TODO: データ取得処理をいれる
    console.log({ parent, args, context });
    console.log({ name: context.user.name });
    return sampleBooks;
  },
  currentNumber: () => {
    return currentNumber;
  },
};

// SubscribeResolver(WebSocket)の定義
const subscribeResolvers: SubscriptionResolvers<Context> = {
  numberIncremented: {
    // NOTE: graphql-subscriptions asyncIteratorの片付けが間違っているようなので any 型で回避
    // https://github.com/dotansimha/graphql-code-generator/pull/7015#issuecomment-976211984
    subscribe: () =>
      pubsub.asyncIterator([subscribeTypes.NUMBER_INCREMENTED]) as any,
  },
};

const resolvers: Resolvers = {
  Query: queryResolvers,
  Subscription: subscribeResolvers,
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const getUser = (token?: string): Context['user'] => {
  if (token === undefined) {
    throw new AuthenticationError(
      '認証されていないユーザはリソースにアクセスできません'
    );
  }

  // TODO: Tokenからユーザー情報を取り出す処理
  return {
    name: 'dummy name',
    email: 'dummy@example.com',
    token,
  };
};

// HTTPServer
const app = express();
const httpServer = createServer(app);

// WebSocketServer
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({ schema }, wsServer);

// サーバーの起動
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ user: getUser(req.headers.authorization) }),
  plugins: [
    // HttpServerの起動
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // WebSocketServerの起動
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  debug: true, // エラーレスポンスにスタックトレースを含ませない
});

await server.start();
server.applyMiddleware({ app });

httpServer.listen(PORT, () => {
  //  NOTE: query でも　subscribe でもエンドポイントは一つ
  console.log(
    `Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
  );
});

const incrementNumber = () => {
  currentNumber++;
  pubsub.publish(subscribeTypes.NUMBER_INCREMENTED, {
    numberIncremented: currentNumber,
  });
  setTimeout(incrementNumber, 1000);
};

incrementNumber();
