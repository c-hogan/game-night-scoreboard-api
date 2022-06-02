import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { IDbService } from '../../interfaces';
import { diContainer } from '../../inversify.config';
import { Player } from '../../models';
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
    const player = JSON.parse(requestBody) as Player;
    const user = event?.requestContext?.authorizer?.jwt?.claims?.email || '';

    // TODO: Add validation
    if (!groupId) {
      throw new Error('Missing id in path. Request should contain groupId (/v1/groups/{groupId}/player');
    }
    if (!player) {
      throw new Error('Missing Player in POST body.');
    }

    const id = nanoid();

    player.id = id;
    player.groupId = groupId;
    player.createdDate = player.lastUpdatedDate = new Date().toISOString();
    player.createdBy = player.lastUpdatedBy = user;

    const table = process.env.GNSB_TABLE || '';

    await dbService.put<Player>(table, 'GROUP#' + groupId, 'PLAYER#' + id, player);

    response = {
      statusCode: 200,
      body: JSON.stringify(player)
    };

  } catch (err) {
    logger.error(err as Error);
    response = {
      statusCode: 500,
      body: 'An error occured while creating Player.'
    }
  }
  return response;
}
