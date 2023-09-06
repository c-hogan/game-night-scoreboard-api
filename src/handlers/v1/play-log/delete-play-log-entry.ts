import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteItem, getDbClient, getItem } from '../../../services/dynamodb';

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

    if(groupSettings.administratorIds.includes(user)){

      const logEntryKey = {
        pk: 'GROUP#' + groupId,
        sk: 'LOG#' + entryId,
      };

      await deleteItem(logEntryKey, dbClient);

      response = {
        statusCode: 200,
        body: `Play Log Entry ${entryId} deleted.`,
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
      body: 'An error occured while deleting Play Log Entry.',
    };
  }
  return response;
};
