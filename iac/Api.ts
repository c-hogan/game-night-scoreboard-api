import { StackContext, Api, Table, Cognito } from 'sst/constructs';

export function iac({ stack }: StackContext) {

  const table = new Table(stack, 'table', {
    fields: {
      pk: 'string',
      sk: 'string',
    },
    primaryIndex: {
      partitionKey: 'pk',
      sortKey: 'sk',
    },
  });

  const api = new Api(stack, 'api', {
    customDomain: stack.stage === 'prod' ? 'api.gamenightscoreboard.com' : `api-${stack.stage}.gamenightscoreboard.com`,
    defaults: {
      authorizer: 'iam',
      function: {
        bind: [table],
      },
    },
    routes: {
      'POST /v1/groups': 'src/handlers/v1/groups/create-group.handler',
      'GET /v1/groups/{groupId}': 'src/handlers/v1/groups/get-group.handler',
      'PUT /v1/groups/{groupId}': 'src/handlers/v1/groups/update-group.handler',
      'DELETE /v1/groups/{groupId}': 'src/handlers/v1/groups/delete-group.handler',
      'POST /v1/groups/{groupId}/players': 'src/handlers/v1/players/create-player.handler',
      'GET /v1/groups/{groupId}/players/{playerId}': 'src/handlers/v1/players/get-player.handler',
      'PUT /v1/groups/{groupId}/players/{playerId}': 'src/handlers/v1/players/update-player.handler',
      'DELETE /v1/groups/{groupId}/players/{playerId}': 'src/handlers/v1/players/delete-player.handler',
      'POST /v1/groups/{groupId}/play-log': 'src/handlers/v1/play-log/create-play-log-entry.handler',
      'GET /v1/groups/{groupId}/play-log': 'src/handlers/v1/play-log/get-group-play-log.handler',
      'GET /v1/groups/{groupId}/play-log/{entryId}': 'src/handlers/v1/play-log/get-play-log-entry.handler',
      'PUT /v1/groups/{groupId}/play-log/{entryId}': 'src/handlers/v1/play-log/update-play-log-entry.handler',
      'DELETE /v1/groups/{groupId}/play-log/{entryId}': 'src/handlers/v1/play-log/delete-play-log-entry.handler',
      $default: 'src/handlers/v1/default.handler',
    },
  });

  const auth = new Cognito(stack, 'auth', {
    login: ['email'],
  });

  auth.attachPermissionsForAuthUsers(stack, [
    api,
  ]);

  stack.addOutputs({
    ApiEndpoint: api.customDomainUrl || api.url,
    UserPoolId: auth.userPoolId,
    IdentityPoolId: auth.cognitoIdentityPoolId,
    UserPoolClientId: auth.userPoolClientId,
  });
}
