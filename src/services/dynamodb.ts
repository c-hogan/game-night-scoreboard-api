import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Agent } from 'http';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Table } from 'sst/node/table';

const TABLE_NAME = Table.table.tableName;

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

  const response = await dbClient.send(command);

  return response.Attributes as T;
};

export const getItem = async <T extends DbItem>(key: DbKey, dbClient: DynamoDBDocumentClient): Promise<T> => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: key,
  });

  const response = await dbClient.send(command);

  delete response.Item?.pk;
  delete response.Item?.sk;

  return response.Item as T;
};

export const queryTable = async <T extends DbItem>(partitionKey: string, dataType: string, dbClient: DynamoDBDocumentClient): Promise<T[]> => {

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

  delete response.Attributes?.pk;
  delete response.Attributes?.sk;

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
