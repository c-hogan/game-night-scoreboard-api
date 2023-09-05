import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { createItem, getDbClient } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const requestBody = event?.body || '';
    const player = JSON.parse(requestBody) as Player;
    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    // TODO: Add validation
    if (!groupId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain groupId (/v1/groups/{groupId}/player).',
      };
    }
    if (!player) {
      return {
        statusCode: 400,
        body: 'Missing Player in POST body.',
      };
    }

    const playerId = nanoid();

    player.id = playerId;
    player.groupId = groupId;
    player.createdDate = player.lastUpdatedDate = new Date().toISOString();
    player.createdBy = player.lastUpdatedBy = user;
    player.pk = 'GROUP#' + groupId;
    player.sk = 'PLAYER#' + playerId;

    if(!dbClient) {
      dbClient = getDbClient();
    }

    // TODO: Add permissions check

    await createItem<Player>(player, dbClient);

    response = {
      statusCode: 200,
      body: JSON.stringify(player),
    };

  } catch (err) {
    response = {
      statusCode: 500,
      body: 'An error occured while creating Player.',
    };
  }
  return response;
};
