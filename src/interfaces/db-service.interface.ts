import { DbItem } from "../models";

export interface IDbService {
  get<T extends DbItem>(tableName: string, key: {[key: string]: string}): Promise<T>;
  put<T extends DbItem>(tableName: string, item: T): Promise<T>;
  update<T extends DbItem>(tableName: string, key: {[key: string]: string}, item: T): Promise<T>;
  delete(tableName: string, key: {[key: string]: string}): Promise<boolean>;
}
