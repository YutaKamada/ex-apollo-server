import { ApolloServer, gql } from 'apollo-server';

// GraphQLスキーマ
const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book!]!
  }
`;

// サンプルデータ
const books = [
  { title: 'The Awakening', author: 'Kate Chopin' },
  { title: 'City of Glass', author: 'Paul Auster' },
  { title: 'Human Disqualification', author: 'Osamu Dazai' },
];

// リゾルバーの定義
const resolvers = {
  Query: {
    books: () => books,
  },
};

// サーバーの起動
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
