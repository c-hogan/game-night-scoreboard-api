import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService } from '../../interfaces';
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
  let response: APIGatewayProxyResult;

  try {
    const id = event?.pathParameters?.id || false;

    if (!id) {
      throw new Error('Missing id in path');
    }

    const table = process.env.PLAY_LOG_TABLE || '';

    const playLogEntry = await dbService.get<PlayLogEntry>(table, id);

    if(!playLogEntry) {
      response = {
        statusCode: 404,
        body: `Play Log Entry ${id} not found.`
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify(playLogEntry)
      };
    }

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: 'An error occured while creating Play Log Entry.'
    }
  }
  return response;
}
