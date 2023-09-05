import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem } from '../../../services/dynamodb';

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
      sk: 'PLAYER#' + playerId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const player = await getItem<Player>(key, dbClient);

    // TODO: Add privacy check

    if(!player) {
      response = {
        statusCode: 404,
        body: `Player ${playerId} not found.`,
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify(player),
      };
    }

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while fetching Player.',
    };
  }
  return response;
};
