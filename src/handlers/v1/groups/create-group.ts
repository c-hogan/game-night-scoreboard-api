import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { createItem, getDbClient } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const requestBody = event?.body || '';
    const group = JSON.parse(requestBody) as GroupMetadata;
    const user = event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId || '';

    // TODO: Add validation
    if (!group) {
      return {
        statusCode: 400,
        body: 'Missing Group in POST body.',
      };
    }

    const groupId = nanoid();

    group.id = groupId;
    const settings: GroupSettings = {
      privacyType: 'private',
      administratorIds: [user],
      viewerIds: [],
    };
    group.settings = settings;
    group.createdDate = group.lastUpdatedDate = new Date().toISOString();
    group.createdBy = group.lastUpdatedBy = user;
    group.pk = 'GROUP#' + groupId;
    group.sk = 'METADATA#' + groupId;

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const result = await createItem<GroupMetadata>(group, dbClient);

    response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };

  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: 'An error occured while creating Group.',
    };
  }
  return response;
};
