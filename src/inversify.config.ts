import 'reflect-metadata';
import { Container } from 'inversify';
import { DynamoDbService, LambdaService } from './services';
import { IDbService, ILambdaService } from './interfaces';
import { InjectableTypes } from './types';

const diContainer = new Container();

diContainer.bind<IDbService>(InjectableTypes.DynamoDbService).to(DynamoDbService);
diContainer.bind<ILambdaService>(InjectableTypes.LambdaService).to(LambdaService);

export { diContainer };
