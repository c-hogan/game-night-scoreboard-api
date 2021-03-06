import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
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
    const requestBody = event?.body || '';
    const playLogEntry = JSON.parse(requestBody) as PlayLogEntry;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    // TODO: Add validation
    if (!groupId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain groupId (/v1/groups/{groupId}/play-log).'
      }
    }
    if (!playLogEntry) {
      return {
        statusCode: 400,
        body: 'Missing Play Log Entry in POST body.'
      }
    }

    const id = nanoid();

    playLogEntry.id = id;
    playLogEntry.groupId = groupId;
    playLogEntry.createdDate = playLogEntry.lastUpdatedDate = new Date().toISOString();
    playLogEntry.createdBy = playLogEntry.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    await dbService.put<PlayLogEntry>(table, 'GROUP#' + groupId, 'LOG#' + id, playLogEntry);

    response = {
      statusCode: 200,
      body: JSON.stringify(playLogEntry)
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
