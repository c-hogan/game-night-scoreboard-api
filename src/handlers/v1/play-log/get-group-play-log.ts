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
        body: 'Missing id in path.',
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
      const partitionKey = 'GROUP#' + groupId;
      const dataType = 'LOG';
      const playLog = await queryTable<PlayLogEntry>(partitionKey, dataType, dbClient, attributes);

      if(!playLog) {

        response = {
          statusCode: 404,
          body: `Play Log for Group ${groupId} not found.`,
        };
      } else {

        response = {
          statusCode: 200,
          body: JSON.stringify(playLog),
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
      body: 'An error occured while fetching Play Log.',
    };
  }
  return response;
};
