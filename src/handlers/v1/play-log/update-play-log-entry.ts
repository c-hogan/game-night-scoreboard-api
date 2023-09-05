import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, updateItem } from '../../../services/dynamodb';

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

    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    const requestBody = event?.body || '';
    const playLogEntry = JSON.parse(requestBody) as PlayLogEntry;

    // TODO: Add validation
    if (!playLogEntry) {
      return {
        statusCode: 400,
        body: 'Missing Player in PUT body.',
      };
    }

    playLogEntry.lastUpdatedDate = new Date().toISOString();
    playLogEntry.lastUpdatedBy = user;

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'LOG#' + entryId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    // TODO: Add permissions check

    const updatedPlayLogEntry = await updateItem<PlayLogEntry>(key, playLogEntry, dbClient);

    response = {
      statusCode: 200,
      body: JSON.stringify(updatedPlayLogEntry),
    };

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while updating Play Log Entry.',
    };
  }
  return response;
};
