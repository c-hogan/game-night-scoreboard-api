import 'reflect-metadata';
import { Container } from 'inversify';
import { DynamoDbService } from './services';
import { IDbService } from './interfaces';
import { InjectableTypes } from './types';

const diContainer = new Container();

diContainer.bind<IDbService>(InjectableTypes.DynamoDbService).to(DynamoDbService);

export { diContainer };
