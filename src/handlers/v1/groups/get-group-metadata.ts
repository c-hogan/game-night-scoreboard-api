import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, getItem } from '../../../services/dynamodb';

let dbClient: DynamoDBDocumentClient;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  try {
    const groupId = event?.pathParameters?.groupId || false;

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

    const group = await getItem<Group>(key, dbClient);

    // TODO: Add privacy check

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
