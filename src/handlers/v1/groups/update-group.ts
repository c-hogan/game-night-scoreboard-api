import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem, updateItem } from '../../../services/dynamodb';

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

    const requestBody = event?.body || '';
    const group = JSON.parse(requestBody) as GroupMetadata;

    // TODO: Add validation
    if (!group) {
      return {
        statusCode: 400,
        body: 'Missing Group in PUT body',
      };
    }

    group.lastUpdatedDate = new Date().toISOString();
    group.lastUpdatedBy = user;

    const key = {
      pk: 'GROUP#' + groupId,
      sk: 'METADATA#' + groupId,
    };

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupSettings = (await getItem<GroupMetadata>(key, dbClient, ['settings'])).settings;

    if(groupSettings.administratorIds.includes(user)){
      const updatedGroup = await updateItem<GroupMetadata>(key, group, dbClient);

      response = {
        statusCode: 200,
        body: JSON.stringify(updatedGroup),
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
      body: 'An error occured while updating Group.',
    };
  }
  return response;
};
