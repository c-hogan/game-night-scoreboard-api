import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { Group } from '../../models';
import { InjectableTypes } from '../../types';
import * as logger from 'lambda-log';
import { get as _get } from 'lodash';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.options.meta = {
    environment: process.env.APP_ENVIRONMENT
  };
  logger.info('Incoming request', event?.requestContext || '');
  const dbService = diContainer.get<IDbService>(InjectableTypes.DynamoDbService);
  let response: APIGatewayProxyResult;

  try {
    const requestBody = event?.body || '';
    let group = JSON.parse(requestBody) as Group;

    // TODO: Add validation
    if (!group) {
      throw new Error('Missing Group in POST body.');
    }

    group.id = nanoid();
    group.createdDate = group.lastUpdatedDate = Date.now();

    const table = process.env.GROUPS_TABLE || '';

    await dbService.put<Group>(table, group);

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
