import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService, ILambdaService } from '../../interfaces';
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
  const lambdaService = diContainer.get<ILambdaService>(InjectableTypes.LambdaService);

  let origin = '';

  try {
    origin = event?.headers?.origin || '';
    const id = event?.pathParameters?.id || false;

    if (!id) {
      return lambdaService.buildResponse(400, 'Missing id in path.', origin);
    }

    const table = process.env.GNSB_TABLE || '';

    const group = await dbService.get<Group>(table, 'GROUP#' + id, 'METADATA#' + id);

    if(!group) {
      return lambdaService.buildResponse(404, `Group ${id} not found.`, origin);
    } else {
      return lambdaService.buildResponse(200, group, origin);
    }

  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while fetching Group.', origin);
  }
}
