/**
 * Language Server entry point for xTB xcontrol
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DidChangeConfigurationNotification,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { defaultXtbSchema } from '@xtb-xcontrol/shared';
import { parseXtbDocument } from './parser/xtbParser';
import { validateDocument, DiagnosticConfig } from './diagnostics/rules';
import { getEffectiveConfig, UserDiagnosticConfig } from './diagnostics/config';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

// Cached configuration
let globalConfig: DiagnosticConfig | undefined;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  connection.console.log('xTB xcontrol Language Server initialized');
});

// Configuration change handler
connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset cached configuration
    globalConfig = undefined;
  } else {
    globalConfig = getEffectiveConfig((change.settings.xtbXcontrol || {}) as UserDiagnosticConfig);
  }

  // Revalidate all open documents
  documents.all().forEach(validateTextDocument);
});

// Document change handler
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

async function getDocumentConfig(resource: string): Promise<DiagnosticConfig> {
  if (!hasConfigurationCapability) {
    return globalConfig || getEffectiveConfig();
  }

  const config = await connection.workspace.getConfiguration({
    scopeUri: resource,
    section: 'xtbXcontrol.diagnostics',
  });

  const userConfig: UserDiagnosticConfig = {
    'xtbXcontrol.diagnostics.unknownInstruction': config.unknownInstruction,
    'xtbXcontrol.diagnostics.unknownOption': config.unknownOption,
    'xtbXcontrol.diagnostics.suspiciousOperator': config.suspiciousOperator,
    'xtbXcontrol.diagnostics.duplicateOption': config.duplicateOption,
    'xtbXcontrol.diagnostics.orphanOption': config.orphanOption,
    'xtbXcontrol.diagnostics.missingEnd': config.missingEnd,
  };

  return getEffectiveConfig(userConfig);
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  try {
    // Get configuration
    const config = await getDocumentConfig(textDocument.uri);

    // Parse the document
    const text = textDocument.getText();
    const parsedDoc = parseXtbDocument(text, defaultXtbSchema);

    // Run diagnostics
    const diagnostics = validateDocument(parsedDoc, defaultXtbSchema, config);

    // Send diagnostics to client
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  } catch (error) {
    // Log error but don't crash
    connection.console.error(`Error validating document: ${error}`);
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
  }
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
