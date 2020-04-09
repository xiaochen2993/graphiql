import * as monaco from 'monaco-editor';
import { buildClientSchema } from 'graphql';
// @ts-ignore
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';
import { Range as GraphQLRange } from 'graphql-language-service-types';

export interface ICreateData {
  languageId: string;
  enableSchemaRequest: boolean;
  schemaUrl: String;
}
// @ts-ignore
import {
  getDiagnostics,
  // Diagnostic,
  getRange,
  getAutocompleteSuggestions,
  getHoverInformation,
  getTokenRange,
  CompletionItem as GraphQLCompletionItem,
} from 'graphql-languageservice';

import introspectionQuery from './schema';

import { toGraphQLPosition, toMonacoRange, toMarkerData } from './utils';

// @ts-ignore
const schema = buildClientSchema(introspectionQuery, { assumeValid: false });

export type MonacoCompletionItem = monaco.languages.CompletionItem & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};

export function toCompletion(
  entry: GraphQLCompletionItem,
  range: GraphQLRange,
): GraphQLCompletionItem & { range: monaco.IRange } {
  return {
    label: entry.label,
    insertText: entry.insertText || (entry.label as string),
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: toMonacoRange(range),
    kind: entry.kind,
  };
}

export class GraphQLWorker {
  private _ctx: monaco.worker.IWorkerContext;
  // @ts-ignore
  // private _languageService: graphqlService.LanguageService;
  // private schema: GraphQLSchema | null;
  constructor(ctx: monaco.worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    // this.schema = null;
  }
  async doValidation(uri: string): Promise<monaco.editor.IMarkerData[]> {
    const document = this._getTextDocument(uri);
    // @ts-ignore
    const graphqlDiagnostics = await getDiagnostics(document, schema);
    return graphqlDiagnostics.map(toMarkerData);
  }
  async doComplete(
    uri: string,
    position: monaco.Position,
  ): Promise<(GraphQLCompletionItem & { range: monaco.IRange })[]> {
    const document = this._getTextDocument(uri);
    const graphQLPosition = toGraphQLPosition(position);
    const suggestions = await getAutocompleteSuggestions(
      schema,
      document,
      graphQLPosition,
    );
    // return suggestions

    return suggestions.map(suggestion =>
      toCompletion(
        suggestion,
        getRange(
          {
            column: graphQLPosition.character + 1,
            line: graphQLPosition.line + 1,
          },
          document,
        ),
      ),
    );
  }

  async doHover(uri: string, position: monaco.Position) {
    const document = this._getTextDocument(uri);
    const graphQLPosition = toGraphQLPosition(position);

    const hover = await getHoverInformation(schema, document, graphQLPosition);

    return {
      content: hover,
      range: toMonacoRange(
        getTokenRange(
          {
            column: graphQLPosition.character + 1,
            line: graphQLPosition.line + 1,
          },
          document,
        ),
      ),
    };
  }
  async doFormat(text: string): Promise<string> {
    const prettierStandalone = await import('prettier/standalone');
    const prettierGraphqlParser = await import('prettier/parser-graphql');

    return prettierStandalone.format(text, {
      parser: 'graphql',
      plugins: [prettierGraphqlParser],
    });
  }

  private _getTextDocument(_uri: string): string {
    const models = this._ctx.getMirrorModels();
    console.log('allModels', models);
    if (models.length > 0) {
      return models[0].getValue();
    }
    return '';
  }
}

self.onmessage = () => {
  try {
    // ignore the first message
    worker.initialize(
      (ctx: monaco.worker.IWorkerContext, createData: ICreateData) => {
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    throw err;
  }
};
