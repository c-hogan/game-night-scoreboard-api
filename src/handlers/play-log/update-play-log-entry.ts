import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService } from '../../interfaces';
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
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const entryId = event?.pathParameters?.entryId || false;

    if (!groupId || !entryId) {
      throw new Error('Missing id in path. Request should contain both groupId and entryId (/v1/play-log/{groupId}/{entryId})');
    }

    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    const requestBody = event?.body || '';
    const playLogEntry = JSON.parse(requestBody) as PlayLogEntry;

    // TODO: Add validation
    if (!playLogEntry) {
      throw new Error('Missing Player in PUT body');
    }

    playLogEntry.lastUpdatedDate = Date.now();
    playLogEntry.lastUpdatedBy = user;

    const table = process.env.PLAY_LOG_TABLE || '';

    const updatedPlayLogEntry = await dbService.update<PlayLogEntry>(table, { groupId: groupId, id: entryId }, playLogEntry);

    response = {
      statusCode: 200,
      body: JSON.stringify(updatedPlayLogEntry)
    };

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: 'An error occured while creating Play Log Entry.'
    }
  }
  return response;
}
