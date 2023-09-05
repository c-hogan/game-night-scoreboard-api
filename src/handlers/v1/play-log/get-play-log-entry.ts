import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const entryId = event?.pathParameters?.entryId || false;

    if (!groupId || !entryId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain both groupId and entryId (/v1/groups/{groupId}/play-log/{entryId}).',
      };
    }

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'LOG#' + entryId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const playLogEntry = await getItem<PlayLogEntry>(key, dbClient);

    // TODO: Add privacy check

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

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while fetching Play Log Entry.',
    };
  }
  return response;
};
