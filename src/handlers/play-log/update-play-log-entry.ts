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
    const id = event?.pathParameters?.id || false;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    if (!id) {
      throw new Error('Missing id in path');
    }

    const requestBody = event?.body || '';
    const playLogEntry = JSON.parse(requestBody) as PlayLogEntry;

    // TODO: Add validation
    if (!playLogEntry) {
      throw new Error('Missing Player in PUT body');
    }

    playLogEntry.lastUpdatedDate = Date.now();
    playLogEntry.lastUpdatedBy = user;

    const table = process.env.PLAY_LOG_TABLE || '';

    const updatedPlayLogEntry = await dbService.update<PlayLogEntry>(table, id, playLogEntry);

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
