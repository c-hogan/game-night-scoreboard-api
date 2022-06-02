import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService, ILambdaService } from '../../interfaces';
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
  const lambdaService = diContainer.get<ILambdaService>(InjectableTypes.LambdaService);

  let origin = '';

  try {
    origin = event?.headers?.origin || '';
    const groupId = event?.pathParameters?.groupId || false;
    const playerId = event?.pathParameters?.playerId || false;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    if (!groupId || !playerId) {
      return lambdaService.buildResponse(400, 'Missing id in path. Request should contain both groupId and playerId (/v1/groups/{groupId}/players/{playerId}).', origin);
    }

    const requestBody = event?.body || '';
    const player = JSON.parse(requestBody) as Player;

    // TODO: Add validation
    if (!player) {
      return lambdaService.buildResponse(400, 'Missing Player in PUT body.', origin);
    }

    player.lastUpdatedDate = new Date().toISOString();
    player.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    const updatedPlayer = await dbService.update<Player>(table, 'GROUP#' + groupId, 'PLAYER#' + playerId, player);

    return lambdaService.buildResponse(200, updatedPlayer, origin);
  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while updating Player.', origin);
  }
}
