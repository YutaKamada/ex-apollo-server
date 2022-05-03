# ex-apollo-server

ApolloServer で GraphQL のサンプル（サーバーサイド）
HTTP での同期通信と、WebSocket を使用した非同期通信が行えます。

同期通信では、
① サンプルとして定義してある books データ一覧を取得する
② サーバー起動時から `currentNumber` が 一秒ごとに 1 加算される値の現在値を取得する

非同期通信では、
③ `currentNumber` が加算されるごとにイベントを受け取る

ものがあります。

クライアントは
https://studio.apollographql.com/sandbox/explorer
こちらで下記 query を投げる(アカウントが必要)

【同期通信】
① books 一覧を取得する

```
query GetBooks  {
  books {
    title
  }
}
```

② 現在の `currentNumber` の値を受け取る

```
query getCurrentNumber{
 currentNumber
}
```

・"NUMBER_INCREMENTED" が発火されたイベントを listen する

```
subscription ListenAddCurrentNumber {
  numberIncremented
}
```

の Query を発行すると値が取得できます。

参考にさせていただいた URL：

- HTTP
  https://zenn.dev/intercept6/articles/3daca0298d32d8022e71
- Websocket（公式）
  https://www.apollographql.com/docs/apollo-server/data/subscriptions/
 

## コマンド一覧

- 起動コマンド  
  $ yarn  
  $ yarn start  

- schema.graphql から型定義を生成するコマンド  
  $ yarn codegen

## 構成図
```
.
├── src
│ ├── types
│ │ ├── generated
│ │ │ └── graphql.ts // schema.graphql から作成される型定義ファイル で
│ │ └── contenxt.d.ts // リクエスト受け取り時の Context 型定義ファイル（どのような情報を持ちまわるか）
│ └── index.ts // サーバ起動設定、起動コード
├── codegen.yml // codegenerator 設定
└── schema.graphql // graphql で使用する型定義ファイル
```
