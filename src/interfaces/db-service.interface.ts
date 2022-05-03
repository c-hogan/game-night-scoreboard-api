export interface IDbService {
  get<T>(tableName: string, key: any): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
  put<T>(tableName: string, item: T): Promise<boolean>;
  delete<T>(tableName: string, key: any): Promise<boolean>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
