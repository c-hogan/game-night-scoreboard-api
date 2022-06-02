import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService, ILambdaService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { InjectableTypes } from '../../types';
import * as logger from 'lambda-log';
import { PlayLogEntry } from '../../models';

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
    const entryId = event?.pathParameters?.entryId || false;

    if (!groupId || !entryId) {
      return lambdaService.buildResponse(400, 'Missing id in path. Request should contain both groupId and entryId (/v1/groups/{groupId}/play-log/{entryId}).', origin);
    }

    const table = process.env.GNSB_TABLE || '';

    const playLogEntry = await dbService.get<PlayLogEntry>(table, 'GROUP#' + groupId, 'LOG#' + entryId);

    if(!playLogEntry) {
      return lambdaService.buildResponse(404, `Play Log Entry ${entryId} not found.`, origin);
    } else {
      return lambdaService.buildResponse(200, playLogEntry, origin);
    }

  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while fetching Play Log Entry.', origin);
  }
}
