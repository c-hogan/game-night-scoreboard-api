import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { createItem, getDbClient, getItem } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;
    const requestBody = event?.body || '';
    const playLogEntry = JSON.parse(requestBody) as PlayLogEntry;
    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    // TODO: Add validation
    if (!groupId) {
      return {
        statusCode: 400,
        body: 'Missing id in path. Request should contain groupId (/v1/groups/{groupId}/play-log).',
      };
    }
    if (!playLogEntry) {
      return {
        statusCode: 400,
        body: 'Missing Play Log Entry in POST body.',
      };
    }

    const entryId = nanoid();

    playLogEntry.id = entryId;
    playLogEntry.groupId = groupId;
    playLogEntry.createdDate = playLogEntry.lastUpdatedDate = new Date().toISOString();
    playLogEntry.createdBy = playLogEntry.lastUpdatedBy = user;
    playLogEntry.pk = 'GROUP#' + groupId;
    playLogEntry.sk = 'LOG#' + entryId;

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupKey = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    const groupSettings = (await getItem<GroupMetadata>(groupKey, dbClient, ['settings'])).settings;

    if(groupSettings.administratorIds.includes(user)){
      const result = await createItem<PlayLogEntry>(playLogEntry, dbClient);

      response = {
        statusCode: 200,
        body: JSON.stringify(result),
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
      body: 'An error occured while creating Play Log Entry.',
    };
  }
  return response;
};
