import { AuthenticationError } from 'apollo-server';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer, gql } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer } from 'apollo-server-express';
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
const typeDefs = gql `
  type Book {
    title: String
    author: String
  }
  type Query {
    currentNumber: Int
    books: [Book!]!
  }
  type Subscription {
    numberIncremented: Int
  }
`;
// const schema = loadSchemaSync(join(__dirname, '../schema.graphql'), {
//   loaders: [new GraphQLFileLoader()],
// });
// リゾルバーの定義
const resolvers = {
    Query: {
        books: (parent, args, context) => {
            // TODO: 認可処理を入れる
            // TODO: データ取得処理をいれる
            console.log({ parent, args, context });
            console.log({ name: context.user.name });
            return sampleBooks;
        },
        currentNumber: () => {
            return currentNumber;
        },
    },
    Subscription: {
        numberIncremented: {
            subscribe: () => pubsub.asyncIterator([subscribeTypes.NUMBER_INCREMENTED]),
        },
    },
};
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});
// const schemaWithResolvers = addResolversToSchema({ schema, resolvers });
const getUser = (token) => {
    if (token === undefined) {
        throw new AuthenticationError('認証されていないユーザはリソースにアクセスできません');
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
const serverCleanup = useServer({ schema: schema }, wsServer);
// サーバーの起動
const server = new ApolloServer({
    // schema: schemaWithResolvers,
    schema: schema,
    context: ({ req }) => ({ user: getUser(req.headers.authorization) }),
    debug: true,
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
});
await server.start();
server.applyMiddleware({ app });
httpServer.listen(PORT, () => {
    console.log(`Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`);
});
const incrementNumber = () => {
    currentNumber++;
    pubsub.publish(subscribeTypes.NUMBER_INCREMENTED, {
        numberIncremented: currentNumber,
    });
    setTimeout(incrementNumber, 1000);
};
incrementNumber();
