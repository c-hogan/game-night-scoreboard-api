import { DbItem } from "../models";

export interface IDbService {
  get<T extends DbItem>(tableName: string, key: string): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
  put<T extends DbItem>(tableName: string, item: T): Promise<T>;
  update<T extends DbItem>(tableName: string, key :string, item: T): Promise<T>;
  delete(tableName: string, key: string): Promise<boolean>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
