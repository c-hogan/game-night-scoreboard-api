import { APIGatewayProxyResult } from "aws-lambda";

export interface ILambdaService {
  parseEventBodyAsJson<T>(eventBody: string): T;
  buildResponse(statusCode: number, body: any, origin: string): APIGatewayProxyResult;
}
