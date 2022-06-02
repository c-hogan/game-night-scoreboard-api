import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { Player } from '../../models';
import { InjectableTypes } from '../../types';
import * as logger from 'lambda-log';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.options.meta = {
    environment: process.env.APP_ENVIRONMENT
  };
  logger.info('Incoming request', event?.requestContext || '');
  const dbService = diContainer.get<IDbService>(InjectableTypes.DynamoDbService);
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const playerId = event?.pathParameters?.playerId || false;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    if (!groupId || !playerId) {
      throw new Error('Missing id in path. Request should contain both groupId and entryId (/v1/groups/{groupId}/players/{playerId})');
    }

    const requestBody = event?.body || '';
    const player = JSON.parse(requestBody) as Player;

    // TODO: Add validation
    if (!player) {
      throw new Error('Missing Player in PUT body');
    }

    player.lastUpdatedDate = new Date().toISOString();
    player.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    const updatedPlayer = await dbService.update<Player>(table, 'GROUP#' + groupId, 'PLAYER#' + playerId, player);

    response = {
      statusCode: 200,
      body: JSON.stringify(updatedPlayer)
    };

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: JSON.stringify(err)
    }
  }
  return response;
}
