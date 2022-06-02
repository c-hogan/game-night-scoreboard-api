import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService, ILambdaService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
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

    if (!groupId || !playerId) {
      return lambdaService.buildResponse(400, 'Missing id in path. Request should contain both groupId and playerId (/v1/groups/{groupId}/players/{playerId}).', origin);
    }

    const table = process.env.GNSB_TABLE || '';

    await dbService.delete(table, 'GROUP#' + groupId, 'PLAYER#' + playerId);

    return lambdaService.buildResponse(200, `Player ${playerId} deleted.`, origin);
  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while deleting Player.', origin);
  }
}
