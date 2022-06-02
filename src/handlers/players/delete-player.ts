import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
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

    if (!groupId || !playerId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain both groupId and playerId (/v1/groups/{groupId}/players/{playerId}).'
      };
    }

    const table = process.env.GNSB_TABLE || '';

    await dbService.delete(table, 'GROUP#' + groupId, 'PLAYER#' + playerId);

    response = {
      statusCode: 200,
      body: `Player ${playerId} deleted.`
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
