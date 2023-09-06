import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem } from '../../../services/dynamodb';

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

    const attributes = ['name', 'settings', 'players'];

    const group = await getItem<GroupMetadata>(key, dbClient, attributes);

    if(group.settings.privacyType === 'public' || group.settings.administratorIds.includes(user) || group.settings.viewerIds.includes(user)){

      response = {
        statusCode: 200,
        body: JSON.stringify(group),
      };

    } else {

      response = {
        statusCode: 403,
        body: 'Unauthorized.',
      };
    }

    if(!group) {
      response = {
        statusCode: 404,
        body: `Group ${groupId} not found.`,
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify(group),
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
