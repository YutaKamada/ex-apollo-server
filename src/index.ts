import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { addResolversToSchema } from '@graphql-tools/schema';
import { ApolloServer, AuthenticationError } from 'apollo-server';
import { join } from 'path';
import { Context } from './types/contenxt';
import { Resolvers } from './types/generated/graphql';

// サンプルデータ
const books = [
  { title: 'The Awakening', author: 'Kate Chopin' },
  { title: 'City of Glass', author: 'Paul Auster' },
  { title: 'Human Disqualification', author: 'Osamu Dazai' },
  { title: 'Human Disqualification', author: 'Osamu Dazai' },
];

const schema = loadSchemaSync(join(__dirname, '../schema.graphql'), {
  loaders: [new GraphQLFileLoader()],
});

// リゾルバーの定義
const resolvers: Resolvers = {
  Query: {
    books: (_parent, _args, _context) => {
      // TODO: 認可処理を入れる
      return books;
    },
  },
};

const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

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

// サーバーの起動
const server = new ApolloServer({
  schema: schemaWithResolvers,
  context: ({ req }) => ({ user: getUser(req.headers.authorization) }),
  debug: false, // エラーレスポンスにスタックトレースを含ませない
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
