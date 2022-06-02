import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { InjectableTypes } from '../../types';
import * as logger from 'lambda-log';
import { Group } from '../../models';

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

    const table = process.env.GNSB_TABLE || '';

    const group = await dbService.get<Group>(table, 'GROUP#' + id, 'METADATA#' + id);

    if(!group) {
      response = {
        statusCode: 404,
        body: `Group ${id} not found.`
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify(group)
      };
    }

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: JSON.stringify(err)
    }
  }
  return response;
}
