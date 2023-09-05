import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteItem, getDbClient } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const playerId = event?.pathParameters?.playerId || false;

    if (!groupId || !playerId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain both groupId and playerId (/v1/groups/{groupId}/players/{playerId}).',
      };
    }

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'LOG#' + playerId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    // TODO: Add permissions check

    await deleteItem(key, dbClient);

    response = {
      statusCode: 200,
      body: `Player ${playerId} deleted.`,
    };

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while deleting Player.',
    };
  }
  return response;
};
