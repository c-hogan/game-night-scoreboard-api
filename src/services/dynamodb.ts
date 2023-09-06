import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Agent } from 'http';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Table } from 'sst/node/table';

const TABLE_NAME = Table.table.tableName;
const DB_ONLY_PROPERTIES = [
  'pk',
  'sk',
  'createdBy',
  'createdDate',
  'lastUpdatedBy',
  'lastUpdatedDate',
];

export const getDbClient = () => {

  const keepAliveAgent = new Agent({keepAlive: true});

  const dynamoDb = new DynamoDB({
    requestHandler: new NodeHttpHandler({
      httpAgent: keepAliveAgent,
    }),
  });

  return DynamoDBDocumentClient.from(dynamoDb);
};

export const createItem = async <T extends DbItem>(item: T, dbClient: DynamoDBDocumentClient): Promise<T> => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
    Item: item,
  });

  await dbClient.send(command);

  for(const prop in DB_ONLY_PROPERTIES) {
    delete item[prop as keyof T];
  }

  return item as T;
};

export const getItem = async <T>(key: DbKey, dbClient: DynamoDBDocumentClient, projectionAttributes?: string[]): Promise<T> => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: key,
  });

  if(projectionAttributes) {
    const formattedAttributes = projectionAttributes.map((attr, index) => `#field${index}`);
    const attributeNames = projectionAttributes.reduce((accumulator, property, index) => ({
      ...accumulator,
      [`#field${index}`]: property,
    }), {});
    command.input.ExpressionAttributeNames = attributeNames;
    command.input.ProjectionExpression = formattedAttributes.join(', ');
  }

  const response = await dbClient.send(command);

  return response.Item as T;
};

export const queryTable = async <T>(partitionKey: string, dataType: string, dbClient: DynamoDBDocumentClient, projectionAttributes?: string[]): Promise<T[]> => {

  let conditionExpression, attributeValues;

  if (dataType === 'ALL') {
    conditionExpression = 'pk = :pk';
    attributeValues = {
      ':pk': partitionKey,
    };
  } else {
    conditionExpression = 'pk = :pk AND contains(sk, :type)';
    attributeValues = {
      ':pk' : partitionKey,
      ':type': dataType,
    };
  }

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: conditionExpression,
    ExpressionAttributeValues: attributeValues,
  });

  if(projectionAttributes) {
    const formattedAttributes = projectionAttributes.map((attr, index) => `#field${index}`);
    const attributeNames = projectionAttributes.reduce((accumulator, property, index) => ({
      ...accumulator,
      [`#field${index}`]: property,
    }), {});
    command.input.ExpressionAttributeNames = attributeNames;
    command.input.ProjectionExpression = formattedAttributes.join(', ');
  }

  const results: T[] = [];

  let response = await dbClient.send(command);
  response.Items?.forEach(item => results.push(item as T));

  while(response.LastEvaluatedKey) {
    command.input.ExclusiveStartKey = response.LastEvaluatedKey;
    response = await dbClient.send(command);
    response.Items?.forEach(item => results.push(item as T));
  }

  return results as T[];
};

export const updateItem = async <T extends DbItem>(key: DbKey, item: T, dbClient: DynamoDBDocumentClient): Promise<T> => {

  const itemProperties = Object.keys(item).filter(property => property !== 'id');

  const updateExpression = `SET ${itemProperties.map((property, index) => `#field${index} = :value${index}`).join(', ')}`;

  const attributeNames = itemProperties.reduce((accumulator, property, index) => ({
    ...accumulator,
    [`#field${index}`]: property,
  }), {});

  const attributeValues = itemProperties.reduce((accumulator, property, index) => ({
    ...accumulator,
    [`:value${index}`]: item[property as keyof T],
  }), {});

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const response = await dbClient.send(command);

  for(const prop of DB_ONLY_PROPERTIES) {
    delete response.Attributes?.[prop];
  }

  return response.Attributes as T;
};

export const deleteItem = async (key: DbKey, dbClient: DynamoDBDocumentClient): Promise<boolean> => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: key,
  });

  await dbClient.send(command);

  return true;
};
