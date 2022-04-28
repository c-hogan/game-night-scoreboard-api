import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { injectable } from 'inversify';
import { IDbService } from '../interfaces';

@injectable()
export class DynamoDbService implements IDbService {
  protected _client: DocumentClient;

  constructor() {

    if (process.env.IS_OFFLINE) {
      this._client = new DocumentClient({
        region: 'local',
        endpoint: 'http://localhost:8000',
        accessKeyId: 'DEFAULT_ACCESS_KEY',
        secretAccessKey: 'DEFAULT_SECRET'
      });
    } else {
      this._client = new DocumentClient();
    }
  }

  public get = async <T>(tableName: string, objId: string): Promise<T> => {
    const params: DocumentClient.GetItemInput = {
      TableName: tableName,
      Key: {
        id: objId
      }
    };

    try {
      const res = await this._client.get(params).promise();
      return res.Item as T;
    } catch (err) {
      throw err;
    }
  }

  public put = async <T>(tableName: string, obj: T): Promise<boolean> => {
    const params: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: obj
    };

    try {
      await this._client.put(params).promise();
      return true
    } catch (err) {
      throw err;
    }
  }

  public delete = async <T>(tableName: string, objId: string): Promise<boolean> => {

    const params: DocumentClient.DeleteItemInput = {
      TableName: tableName,
      Key: {
        id: objId
      }
    };

    try {
      await this._client.delete(params).promise();
      return true;
    } catch (err) {
      throw err;
    }
  }
}
