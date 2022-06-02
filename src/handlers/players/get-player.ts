import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { InjectableTypes } from '../../types';
import * as logger from 'lambda-log';
import { Player } from '../../models';

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

    if (!groupId || !playerId) {
      throw new Error('Missing id in path. Request should contain both groupId and entryId (/v1/groups/{groupId}/player/{playerId})');
    }

    const table = process.env.GNSB_TABLE || '';

    const player = await dbService.get<Player>(table, 'GROUP#' + groupId, 'PLAYER#' + playerId);

    if(!player) {
      response = {
        statusCode: 404,
        body: `Player ${playerId} not found.`
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify(player)
      };
    }

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: JSON.stringify(err)
    }
  }
  return response;
}
