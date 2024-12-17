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
npm run tgstgen --schema=.example-dir/schema.gql --output=./example-dir/__generated__/schema.graphql.ts 
```

or

```json
{
  "scripts": {
    "tgstgen": "tgstgen --schema=.example-dir/schema.gql --output=./example-dir/__generated__/schema.graphql.ts "
  }
}
```

## CLI Options

### schema

The relative path to the GraphQL schema file to be used.

```sh
tgstgen --schema=.example-dir/schema.gql
```

### output

The relative path to the TypeScript type file to be generated.

```sh
tgstgen --schema=.example-dir/schema.gql
```

### nullableType

When nullableType=relay, nullable values will have the type null | undefined.
When nullableType=relay-classic, nullable values will have the type null only.

```sh
tgstgen --nullableType=relay
```

### noFutureProofEnums

When set to true, the generated enum types will include a %future added value.

```sh
tgstgen --noFutureProofEnums=true
```

### onlyEnum

When set to true, only the enum types will be generated.

```sh
tgstgen --onlyEnum=false
```