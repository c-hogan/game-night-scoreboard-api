import { DbItem } from "../models";

export interface IDbService {
  get<T extends DbItem>(tableName: string, partitionKey:string, sortKey: string): Promise<T>;
  put<T extends DbItem>(tableName: string, partitionKey:string, sortKey: string, item: T): Promise<T>;
  update<T extends DbItem>(tableName: string, partitionKey:string, sortKey: string, item: T): Promise<T>;
  delete(tableName: string, partitionKey:string, sortKey: string): Promise<boolean>;
}
