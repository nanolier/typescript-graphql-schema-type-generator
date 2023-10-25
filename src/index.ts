#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parse, buildASTSchema, ObjectTypeDefinitionNode, EnumTypeDefinitionNode, TypeNode, GraphQLSchema } from 'graphql';

const schemaPath = process.argv[2] ?? './schema.graphql';
const outputPath = process.argv[3] ?? './src/__generated__/schema.graphql.ts';
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

const convertTSUnionTypeString = (node: EnumTypeDefinitionNode): string => {
  if (!node.values) return '';

  const enumValues = node.values.map((value) => `"${value.name.value}"`).join(' | ');
  return `export type ${node.name.value} = ${enumValues} | "%future added value";`;
};

const convertTSValueString = (typeName: string): string => {
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

const convertTSObjectTypeString = (type: ObjectTypeDefinitionNode): string => {
  if (!type.fields) return '';

  const fields = type.fields
    .map((field) => {
      const fieldType = getType(field.type);
      const nullable = field.type.kind !== 'NonNullType' ? ' | null' : '';

      return `${field.name.value}: ${convertTSValueString(fieldType)}${nullable}`;
    })
    .join('; ');
  return `export type ${type.name.value} = { ${fields} };`;
};

const parseGraphQLSchemaToTypeAliasString = (schema: GraphQLSchema): string => {
  const typeDefs = [];
  const unionTypes = [];

  for (const type of Object.values(schema.getTypeMap())) {
    if (!type.astNode) continue;

    if (type.astNode.kind === 'ObjectTypeDefinition') {
      typeDefs.push(convertTSObjectTypeString(type.astNode));
    } else if (type.astNode.kind === 'EnumTypeDefinition') {
      unionTypes.push(convertTSUnionTypeString(type.astNode));
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
