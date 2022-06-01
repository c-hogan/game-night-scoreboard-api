import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { injectable } from 'inversify';
import { IDbService } from '../interfaces';
import { DbItem } from '../models';

@injectable()
export class DynamoDbService implements IDbService {

  protected _ddbClient: DynamoDBClient;
  protected _docClient: DynamoDBDocumentClient;

  constructor() {

    if (process.env.IS_OFFLINE) {

      this._ddbClient = new DynamoDBClient({
        region: 'local',
        endpoint: 'http://localhost:8000'
      });

    } else {

      this._ddbClient = new DynamoDBClient({});

    }

    this._docClient = DynamoDBDocumentClient.from(this._ddbClient);
  }

  public put = async <T extends DbItem>(tableName: string, obj: T): Promise<T> => {

    await this._docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: obj
      })
    );

    return obj;
  }

  public get = async <T extends DbItem>(tableName: string, key: {[key: string]: string}): Promise<T> => {

    const res = await this._docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: key
      })
    );

    return res.Item as T;
  }

  public update = async <T extends DbItem>(tableName: string, key: {[key: string]: string}, obj: any): Promise<T> => {

    const objKeys = Object.keys(obj).filter(k => k !== 'id');

    const updateExpression = `SET ${objKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`;

    const attributeNames = objKeys.reduce((accumulator, k, index) => ({
      ...accumulator,
      [`#field${index}`]: k
    }), {});

    const attributeValues = objKeys.reduce((accumulator, k, index) => ({
      ...accumulator,
      [`:value${index}`]: obj[k]
    }), {});

    const res = await this._docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
        ReturnValues: 'ALL_NEW'
      })
    );

    return res.Attributes as T;
  }

  public delete = async (tableName: string, key: {[key: string]: string}): Promise<boolean> => {

    await this._docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key
      })
    );

    return true;
  }
}
