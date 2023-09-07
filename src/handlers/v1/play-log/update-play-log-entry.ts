import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem, updateItem } from '../../../services/dynamodb';

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

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupKey = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    const groupSettings = (await getItem<GroupMetadata>(groupKey, dbClient, ['settings'])).settings;
    
    if(groupSettings.administratorIds.includes(user)){
      const key = {
        pk: 'GROUP#' + groupId,
        sk: 'LOG#' + entryId,
      };

      playLogEntry.lastUpdatedDate = new Date().toISOString();
      playLogEntry.lastUpdatedBy = user;

      const updatedPlayLogEntry = await updateItem<PlayLogEntry>(key, playLogEntry, dbClient);

      response = {
        statusCode: 200,
        body: JSON.stringify(updatedPlayLogEntry),
      };

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
      body: 'An error occured while updating Play Log Entry.',
    };
  }
  return response;
};
