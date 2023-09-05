import { SSTConfig } from 'sst';
import { iac } from './iac/Api';

export default {
  config(_input) {
    return {
      name: 'gnsb-api',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    if (app.stage !== 'prod' && app.stage !== 'beta') {
      app.setDefaultRemovalPolicy('destroy');
    }
    app.stack(iac);
  },
} satisfies SSTConfig;
