#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import {
  parse,
  buildASTSchema,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  TypeNode,
  GraphQLSchema,
  InterfaceTypeDefinitionNode,
  UnionTypeDefinitionNode,
  ScalarTypeDefinitionNode,
} from 'graphql';

const args = process.argv.slice(2);

const parsedArgs: Record<string, string> = {};
args.forEach((arg) => {
  const [key, value] = arg.split('=');

  if (key && value) {
    parsedArgs[key.replace('--', '')] = value;
  }
});

const schemaPath = parsedArgs.schema ?? './schema.graphql';
const outputPath = parsedArgs.output ?? './src/__generated__/schema.graphql.ts';
const noFutureProofEnums = parsedArgs.noFutureProofEnums ? parsedArgs.noFutureProofEnums === 'true' : false;
const nullString = parsedArgs.nullableType === 'relay-classic' ? 'null' : 'null | undefined';
const onlyEnum = parsedArgs.onlyEnum ? parsedArgs.onlyEnum === 'true' : false;
const schemaSDL = fs.readFileSync(schemaPath, 'utf-8');

const getType = (typeNode: TypeNode): string => {
  switch (typeNode.kind) {
    case 'NamedType':
      return typeNode.name.value;
    case 'ListType':
      return `Array<${getType(typeNode.type)}>`;
    case 'NonNullType':
      return getType(typeNode.type);
    default:
      return 'any';
  }
};

const convertGraphQLEnum = (node: EnumTypeDefinitionNode): string => {
  if (!node.values) return '';

  const enumValues = node.values.map((value) => `"${value.name.value}"`).join(' | ');

  const futureValue = noFutureProofEnums ? '' : '| "%future added value"';

  return `export type ${node.name.value} = ${enumValues}${futureValue};`;
};

const convertGraphQLValue = (typeName: string): string => {
  if (typeName.includes('Array<')) {
    const regex = /<([^>]+)>/;
    const match = typeName.match(regex);

    if (match) {
      return `Array<${convertGraphQLValue(match[1])}>`;
    }
  }

  switch (typeName) {
    case 'Int':
    case 'Float':
      return 'number';
    case 'String':
    case 'ID':
      return 'string';
    case 'Boolean':
      return 'boolean';
    default:
      return typeName;
  }
};

const convertGraphQLObject = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): string => {
  if (!type.fields) return '';

  const fields = type.fields
    .map((field) => {
      const fieldType = getType(field.type);
      const nullable = field.type.kind !== 'NonNullType' ? ` | ${nullString}` : '';

      return `${field.name.value}: ${convertGraphQLValue(fieldType)}${nullable}`;
    })
    .join('; ');
  return `export type ${type.name.value} = { ${fields} };`;
};

const convertGraphQLUnion = (node: UnionTypeDefinitionNode) => {
  if (!node.types) return '';

  const unionTypes = node.types.map((type) => getType(type)).join(' | ');
  return `export type ${node.name.value} = ${unionTypes};`;
};

const convertGraphQLScaler = (node: ScalarTypeDefinitionNode) => {
  switch (node.name.value) {
    case 'Int':
    case 'Float':
      return `export type ${node.name.value} = number;`;
    case 'String':
    case 'ID':
    case 'Boolean':
      return `export type ${node.name.value} = boolean;`;
    default:
      return `export type ${node.name.value} = string;`;
  }
};

const parseGraphQLSchemaToTypeAliasString = (schema: GraphQLSchema): string => {
  const typeDefs = [];
  const unionTypes = [];

  for (const type of Object.values(schema.getTypeMap())) {
    if (!type.astNode) continue;

    if (!onlyEnum) {
      if (type.astNode.kind === 'ObjectTypeDefinition' || type.astNode.kind === 'InterfaceTypeDefinition') {
        typeDefs.push(convertGraphQLObject(type.astNode));
      } else if (type.astNode.kind === 'EnumTypeDefinition') {
        unionTypes.push(convertGraphQLEnum(type.astNode));
      } else if (type.astNode.kind === 'UnionTypeDefinition') {
        typeDefs.push(convertGraphQLUnion(type.astNode));
      } else if (type.astNode.kind === 'ScalarTypeDefinition') {
        typeDefs.push(convertGraphQLScaler(type.astNode));
      }
    } else {
      if (type.astNode.kind === 'EnumTypeDefinition') {
        unionTypes.push(convertGraphQLEnum(type.astNode));
      }
    }
  }

  return [...typeDefs, ...unionTypes].join('\n');
};

const main = (schemaSDL: string) => {
  const schemaAST = parse(schemaSDL);
  const schema = buildASTSchema(schemaAST);

  const output = parseGraphQLSchemaToTypeAliasString(schema);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
};

main(schemaSDL);
