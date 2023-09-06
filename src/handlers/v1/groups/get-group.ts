import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem, queryTable } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    if (!groupId) {
      return {
        statusCode: 400,
        body: 'Missing id in path',
      };
    }

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupSettings = (await getItem<GroupMetadata>(key, dbClient, ['settings'])).settings;

    if(groupSettings.privacyType === 'public' || groupSettings.administratorIds.includes(user) || groupSettings.viewerIds.includes(user)){

      const attributes = ['name', 'settings', 'players', 'groupId', 'gameId', 'playerIds', 'winnerIds', 'date', 'notes'];
      const group = await queryTable<GroupMetadata|PlayLogEntry>(key.pk, 'ALL', dbClient, attributes);

      const metadata = group.find((item): item is GroupMetadata => (item as GroupMetadata).settings !== undefined);
      const playLog = group.filter((item): item is PlayLogEntry => (item as PlayLogEntry).gameId !== undefined);

      if(!group || !metadata) {

        response = {
          statusCode: 404,
          body: `Data for Group ${groupId} not found.`,
        };
      } else {

        response = {
          statusCode: 200,
          body: JSON.stringify({metadata, playLog}),
        };
      }

    } else {

      response = {
        statusCode: 403,
        body: 'Unauthorized.',
      };
    }

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while fetching Group.',
    };
  }
  return response;
};
