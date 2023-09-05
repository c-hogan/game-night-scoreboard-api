import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteItem, getDbClient } from '../../../services/dynamodb';

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

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    // TODO: Add permissions check

    await deleteItem(key, dbClient);

    response = {
      statusCode: 200,
      body: `Group ${groupId} deleted.`,
    };

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while deleting Group.',
    };
  }
  return response;
};
