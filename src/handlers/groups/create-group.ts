import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { Group } from '../../models';
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
    const requestBody = event?.body || '';
    const group = JSON.parse(requestBody) as Group;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    // TODO: Add validation
    if (!group) {
      throw new Error('Missing Group in POST body.');
    }

    const id = nanoid();

    group.id = id;
    group.createdDate = group.lastUpdatedDate = new Date().toISOString();
    group.createdBy = group.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    await dbService.put<Group>(table, 'GROUP#' + id, 'METADATA#' + id, group);

    response = {
      statusCode: 200,
      body: JSON.stringify(group)
    };

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: 'An error occured while creating Group.'
    }
  }
  return response;
}
