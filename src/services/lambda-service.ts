import { APIGatewayProxyResult } from 'aws-lambda';
import { injectable } from 'inversify';
import { ILambdaService } from '../interfaces';

@injectable()
export class LambdaService implements ILambdaService {

  protected allowedOrigins: string[];

  constructor() {

    this.allowedOrigins = [
      'http://localhost:3000'
      // add origins based on environment
    ]

  }

  public parseEventBodyAsJson = <T>(eventBody: string): T  => {
    return JSON.parse(eventBody) as T;
  }

  public buildResponse = (statusCode: number, body: any, origin: string): APIGatewayProxyResult => {
    const response: APIGatewayProxyResult = {
      isBase64Encoded: false,
      statusCode: statusCode,
      body: JSON.stringify(body)
    };

    if(this.allowedOrigins.indexOf(origin) > -1) {
      response.headers = { 'Access-Control-Allow-Origin': origin };
    }

    return response;
  }
}
