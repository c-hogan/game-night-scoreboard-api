import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, updateItem } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const playerId = event?.pathParameters?.playerId || false;
    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    if (!groupId || !playerId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain both groupId and playerId (/v1/groups/{groupId}/players/{playerId}).',
      };
    }

    const requestBody = event?.body || '';
    const player = JSON.parse(requestBody) as Player;

    // TODO: Add validation
    if (!player) {
      return {
        statusCode: 400,
        body: 'Missing Player in PUT body.',
      };
    }

    player.lastUpdatedDate = new Date().toISOString();
    player.lastUpdatedBy = user;

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'PLAYER#' + playerId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    // TODO: Add permissions check

    const updatedPlayer = await updateItem<Player>(key, player, dbClient);
    response = {
      statusCode: 200,
      body: JSON.stringify(updatedPlayer),
    };

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while updating Player.',
    };
  }
  return response;
};
