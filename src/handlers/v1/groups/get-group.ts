import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDbClient, queryTable } from '../../../services/dynamodb';

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

    const partitionKey = 'GROUP#' + groupId;
    const dataType = 'ALL';

    if(!dbClient) {
      dbClient = getDbClient();
    }

    const groupData = await queryTable<Group | Player | PlayLogEntry>(partitionKey, dataType, dbClient);

    // TODO: Add privacy check
    const metadata = groupData.find((data) => data.sk.includes('METADATA'));
    const players = groupData.filter((data) => data.sk.includes('PLAYER'));
    const playLog = groupData.filter((data) => data.sk.includes('LOG'));

    if(!groupData || !metadata) {
      response = {
        statusCode: 404,
        body: `Data for Group ${groupId} not found.`,
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify({metadata, players, playLog}),
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
