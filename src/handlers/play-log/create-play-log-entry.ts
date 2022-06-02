import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { IDbService, ILambdaService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { PlayLogEntry } from '../../models';
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
    const eventBody = event?.body || '';
    const playLogEntry = lambdaService.parseEventBodyAsJson<PlayLogEntry>(eventBody);
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    // TODO: Add validation
    if (!groupId) {
      return lambdaService.buildResponse(400, 'Missing id in path. Request should contain groupId (/v1/groups/{groupId}/play-log).', origin);
    }
    if (!playLogEntry) {
      return lambdaService.buildResponse(400, 'Missing Play Log Entry in POST body.', origin);
    }

    const id = nanoid();

    playLogEntry.id = id;
    playLogEntry.groupId = groupId;
    playLogEntry.createdDate = playLogEntry.lastUpdatedDate = new Date().toISOString();
    playLogEntry.createdBy = playLogEntry.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    await dbService.put<PlayLogEntry>(table, 'GROUP#' + groupId, 'LOG#' + id, playLogEntry);

    return lambdaService.buildResponse(200, playLogEntry, origin);
  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while creating Play Log Entry.', origin);
  }
}
