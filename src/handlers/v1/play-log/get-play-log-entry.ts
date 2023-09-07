import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const entryId = event?.pathParameters?.entryId || false;
    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    if (!groupId || !entryId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain both groupId and entryId (/v1/groups/{groupId}/play-log/{entryId}).',
      };
    }

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupKey = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    const groupSettings = (await getItem<GroupMetadata>(groupKey, dbClient, ['settings'])).settings;

    if(groupSettings.privacyType === 'public' || groupSettings.administratorIds.includes(user) || groupSettings.viewerIds.includes(user)){

      const attributes = ['id', 'groupId', 'gameId', 'playerIds', 'winnerIds', 'date', 'notes'];
      const key = {
        pk: 'GROUP#' + groupId,
        sk: 'LOG#' + entryId,
      };
      const playLogEntry = await getItem<PlayLogEntry>(key, dbClient, attributes);

      if(!playLogEntry) {

        response = {
          statusCode: 404,
          body: `Play Log Entry ${entryId} not found.`,
        };
      } else {

        response = {
          statusCode: 200,
          body: JSON.stringify(playLogEntry),
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
      body: 'An error occured while fetching Play Log Entry.',
    };
  }
  return response;
};
