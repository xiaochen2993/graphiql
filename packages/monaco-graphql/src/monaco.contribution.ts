// / <reference path="./monaco.d.ts"/>

import { graphqlLanguage as monacoGraphQL } from './monaco';

import * as monaco from 'monaco-editor';

import * as mode from './graphqlMode';

import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;

// @ts-ignore
export { language as monarchLanguage } from 'monaco-languages/release/esm/graphql/graphql';

export const LANGUAGE_ID = 'graphqlDev';
// --- JSON configuration and defaults ---------

export class LanguageServiceDefaultsImpl
  implements monacoGraphQL.LanguageServiceDefaults {
  private _onDidChange = new Emitter<monacoGraphQL.LanguageServiceDefaults>();
  // @ts-ignore
  private _diagnosticsOptions: monacoGraphQL.DiagnosticsOptions;
  // @ts-ignore
  private _modeConfiguration: monacoGraphQL.ModeConfiguration;
  private _languageId: string;

  constructor(
    languageId: string,
    // @ts-ignore
    diagnosticsOptions: monacoGraphQL.DiagnosticsOptions,
    // @ts-ignore
    modeConfiguration: monacoGraphQL.ModeConfiguration,
  ) {
    this._languageId = languageId;
    this.setDiagnosticsOptions(diagnosticsOptions);
    this.setModeConfiguration(modeConfiguration);
  }
  // @ts-ignore
  get onDidChange(): IEvent<monacoGraphQL.LanguageServiceDefaults> {
    return this._onDidChange.event;
  }

  get languageId(): string {
    return this._languageId;
  }
  // @ts-ignore
  get modeConfiguration(): monacoGraphQL.ModeConfiguration {
    return this._modeConfiguration;
  }
  // @ts-ignore
  get diagnosticsOptions(): monacoGraphQL.DiagnosticsOptions {
    return this._diagnosticsOptions;
  }

  setDiagnosticsOptions(
    // @ts-ignore
    options: monacoGraphQL.DiagnosticsOptions,
  ): void {
    this._diagnosticsOptions = options || Object.create(null);
    this._onDidChange.fire(this);
  }

  setModeConfiguration(
    // @ts-ignore
    modeConfiguration: monacoGraphQL.ModeConfiguration,
  ): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }
}

// @ts-ignore
const diagnosticDefault: Required<monacoGraphQL.DiagnosticsOptions> = {
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: true,
};

// @ts-ignore
const modeConfigurationDefault: Required<monacoGraphQL.ModeConfiguration> = {
  documentFormattingEdits: false,
  documentRangeFormattingEdits: false,
  completionItems: true,
  hovers: false,
  documentSymbols: false,
  tokens: false,
  colors: false,
  foldingRanges: false,
  diagnostics: true,
  selectionRanges: false,
};

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
  // console.log('defaults', graphqlDefaults)
  graphqlMode.setupMode(graphqlDefaults);
});

// // // --- Registration to monaco editor ---

function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}
