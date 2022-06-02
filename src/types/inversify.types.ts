const InjectableTypes = {
  DynamoDbService: Symbol.for('DynamoDbService'),
  LambdaService: Symbol.for('LambdaService')
};

export { InjectableTypes };
