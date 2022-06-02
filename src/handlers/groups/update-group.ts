import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
    const id = event?.pathParameters?.id || false;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    if (!id) {
      return {
        statusCode: 400,
        body: 'Missing id in path'
      };
    }

    const requestBody = event?.body || '';
    const group = JSON.parse(requestBody) as Group;

    // TODO: Add validation
    if (!group) {
      return {
        statusCode: 400,
        body: 'Missing Group in PUT body'
      };
    }

    group.lastUpdatedDate = new Date().toISOString();
    group.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    const updatedGroup = await dbService.update<Group>(table, 'GROUP#' + id, 'METADATA#' + id, group);

    response = {
      statusCode: 200,
      body: JSON.stringify(updatedGroup)
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
