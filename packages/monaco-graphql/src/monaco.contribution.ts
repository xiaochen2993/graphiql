import * as mode from './graphqlMode';
import {
  LanguageServiceDefaultsImpl,
  diagnosticDefault,
  modeConfigurationDefault,
} from './defaults';

import * as monaco from 'monaco-editor';

// @ts-ignore
export { language as monarchLanguage } from 'monaco-languages/release/esm/graphql/graphql';

export const LANGUAGE_ID = 'graphqlDev';

monaco.languages.register({
  id: LANGUAGE_ID,
  extensions: ['.graphql', '.gql'],
  aliases: ['graphql'],
  mimetypes: ['application/graphql', 'text/graphql'],
});

const graphqlDefaults = new LanguageServiceDefaultsImpl(
  LANGUAGE_ID,
  diagnosticDefault,
  modeConfigurationDefault,
);

// Export API
function createAPI() {
  return {
    graphqlDefaults,
  };
}

// @ts-ignore
monaco.languages[LANGUAGE_ID] = createAPI();

monaco.languages.onLanguage(LANGUAGE_ID, async () => {
  const graphqlMode = await getMode();
  graphqlMode.setupMode(graphqlDefaults);
});

function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}
