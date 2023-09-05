import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event));
  const response: APIGatewayProxyResult = {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Route not found.',
    }),
  };
  return response;
};
