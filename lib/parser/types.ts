/**
 * Types for file parsing and dependency analysis
 */

export type ImportType =
  | "default" // import Foo from './foo'
  | "named" // import { Foo } from './foo'
  | "namespace" // import * as Foo from './foo'
  | "side-effect" // import './foo'
  | "dynamic" // import('./foo')
  | "require"; // const foo = require('./foo')

export interface ImportStatement {
  /** The source module being imported (e.g., './utils', 'react', '@/lib/helpers') */
  source: string;
  /** Type of import */
  type: ImportType;
  /** Imported identifiers (for named/default imports) */
  identifiers?: string[];
  /** Line number in source file */
  lineNumber?: number;
}

export interface ExportStatement {
  /** What is being exported */
  identifiers: string[];
  /** Is this a re-export from another module? */
  source?: string;
  /** Is this a default export? */
  isDefault: boolean;
  /** Line number in source file */
  lineNumber?: number;
}

export interface ParsedFile {
  /** Absolute path to the file */
  filePath: string;
  /** Programming language */
  language: string;
  /** All imports found in the file */
  imports: ImportStatement[];
  /** All exports found in the file */
  exports: ExportStatement[];
  /** Any parsing errors encountered */
  errors?: string[];
}

export interface FileNode {
  /** Absolute path to the file */
  filePath: string;
  /** Repository ID this file belongs to */
  repoId: string;
  /** Programming language (typescript, javascript, etc.) */
  language: string;
  /** File extension (.ts, .tsx, .js, etc.) */
  extension: string;
  /** Relative path from repository root */
  relativePath: string;
}

export interface DependencyEdge {
  /** Source file absolute path */
  from: string;
  /** Target file absolute path */
  to: string;
  /** Type of import */
  importType: ImportType;
  /** Line number where import occurs */
  lineNumber?: number;
}

/**
 * Interface for language-specific parsers
 * This allows extending to support more languages in the future
 */
export interface ILanguageParser {
  /** Name of the language this parser handles */
  language: string;

  /** File extensions this parser can handle */
  supportedExtensions: string[];

  /**
   * Parse a file and extract imports and exports
   */
  parseFile(filePath: string, content: string): Promise<ParsedFile>;

  /**
   * Extract only imports from a file (faster when exports aren't needed)
   */
  extractImports(filePath: string, content: string): Promise<ImportStatement[]>;

  /**
   * Extract only exports from a file
   */
  extractExports(filePath: string, content: string): Promise<ExportStatement[]>;
}
