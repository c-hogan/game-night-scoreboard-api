import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteItem, getDbClient, getItem, queryTable } from '../../../services/dynamodb';

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

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupSettings = (await getItem<GroupMetadata>(key, dbClient, ['settings'])).settings;

    if(groupSettings.administratorIds.includes(user)){
      const attributes = ['pk', 'sk'];
      const group = await queryTable<GroupMetadata|PlayLogEntry>(key.pk, 'ALL', dbClient, attributes);

      for (const item of group) {
        const key = {
          pk: item.pk,
          sk: item.sk,
        };
        await deleteItem(key, dbClient);
      }

      response = {
        statusCode: 200,
        body: `Group ${groupId} deleted.`,
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
      body: 'An error occured while deleting Group.',
    };
  }
  return response;
};
