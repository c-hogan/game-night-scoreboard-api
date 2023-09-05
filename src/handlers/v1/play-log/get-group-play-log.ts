import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, queryTable } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;

    if (!groupId) {
      return {
        statusCode: 400,
        body: 'Missing id in path.',
      };
    }

    const partitionKey = 'GROUP#' + groupId;
    const dataType = 'LOG';

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const playLog = await queryTable<PlayLogEntry>(partitionKey, dataType, dbClient);

    // TODO: Add privacy check

    response = {
      statusCode: 200,
      body: JSON.stringify(playLog),
    };

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while fetching Play Log.',
    };
  }
  return response;
};
