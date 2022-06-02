import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IDbService, ILambdaService } from '../../interfaces';
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
  const lambdaService = diContainer.get<ILambdaService>(InjectableTypes.LambdaService);

  let origin = '';

  try {
    origin = event?.headers?.origin || '';
    const id = event?.pathParameters?.id || false;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    if (!id) {
      return lambdaService.buildResponse(400, 'Missing id in path.', origin);
    }

    const eventBody = event?.body || '';
    const group = lambdaService.parseEventBodyAsJson<Group>(eventBody);

    // TODO: Add validation
    if (!group) {
      return lambdaService.buildResponse(400, 'Missing Group in PUT body.', origin);
    }

    group.lastUpdatedDate = new Date().toISOString();
    group.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    const updatedGroup = await dbService.update<Group>(table, 'GROUP#' + id, 'METADATA#' + id, group);

    return lambdaService.buildResponse(200, updatedGroup, origin);
  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while updating Group.', origin);
  }
}
