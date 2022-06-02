import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
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
    const eventBody = event?.body || '';
    const group = lambdaService.parseEventBodyAsJson<Group>(eventBody);
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    // TODO: Add validation
    if (!group) {
      return lambdaService.buildResponse(400, 'Missing Group in POST body.', origin);
    }

    const id = nanoid();

    group.id = id;
    group.createdDate = group.lastUpdatedDate = new Date().toISOString();
    group.createdBy = group.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    await dbService.put<Group>(table, 'GROUP#' + id, 'METADATA#' + id, group);

    return lambdaService.buildResponse(200, group, origin);
  } catch (err) {
    logger.error(err as Error);
    return lambdaService.buildResponse(500, 'An error occurred while creating Group.', origin);
  }
}
