# Typescript Graphql Schema Type Generator

## 🐈 CLI tool to create Type Alias for TypeScript from GraphQL schema

## Getting Started

### Install

Install the library.

```sh
npm i -D @nanolier/typescript-graphql-schema-type-generator
```

Add to scripts in package.json.

```json
{
  "scripts": {
    "tgstgen": "tgstgen"
  }
}
```

### Create Type Alias File

```sh
npm run tgstgen
```

By default, "./schema.graphql" is read and "./src/\_\_generated\_\_/schema.graphql.ts".
To change this, specify the file to be read and the output destination as arguments when executing the command.

```sh
npm run tgstgen .example-dir/schema.gql ./example-dir/__generated__/schema.graphql.ts
```

or

```json
{
  "scripts": {
    "tgstgen": "tgstgen .example-dir/schema.gql ./example-dir/__generated__/schema.graphql.ts"
  }
}
```
