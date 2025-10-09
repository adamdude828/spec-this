import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import {
  ILanguageParser,
  ParsedFile,
  ImportStatement,
  ExportStatement,
  ImportType,
} from "./types.ts";

export class TypeScriptParser implements ILanguageParser {
  language = "typescript";
  supportedExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    // Use TypeScript grammar for both .ts and .tsx files
    this.parser.setLanguage(TypeScript.typescript);
  }

  async parseFile(filePath: string, content: string): Promise<ParsedFile> {
    const errors: string[] = [];

    try {
      const tree = this.parser.parse(content);
      const imports = this.extractImportsFromTree(tree, content);
      const exports = this.extractExportsFromTree(tree, content);

      return {
        filePath,
        language: this.language,
        imports,
        exports,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      errors.push(`Parse error: ${error}`);
      return {
        filePath,
        language: this.language,
        imports: [],
        exports: [],
        errors,
      };
    }
  }

  async extractImports(
    filePath: string,
    content: string
  ): Promise<ImportStatement[]> {
    try {
      const tree = this.parser.parse(content);
      return this.extractImportsFromTree(tree, content);
    } catch (error) {
      console.error(`Failed to extract imports from ${filePath}:`, error);
      return [];
    }
  }

  async extractExports(
    filePath: string,
    content: string
  ): Promise<ExportStatement[]> {
    try {
      const tree = this.parser.parse(content);
      return this.extractExportsFromTree(tree, content);
    } catch (error) {
      console.error(`Failed to extract exports from ${filePath}:`, error);
      return [];
    }
  }

  private extractImportsFromTree(
    tree: Parser.Tree,
    content: string
  ): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const rootNode = tree.rootNode;

    // Traverse the tree to find imports
    this.traverseNode(rootNode, (node) => {
      // ES6 import statements
      if (node.type === "import_statement") {
        const importStmt = this.parseImportStatement(node, content);
        if (importStmt) {
          imports.push(importStmt);
        }
      }

      // Dynamic imports: import('module')
      if (
        node.type === "call_expression" &&
        node.firstChild?.text === "import"
      ) {
        const source = this.extractStringLiteral(node, content);
        if (source) {
          imports.push({
            source,
            type: "dynamic",
            lineNumber: node.startPosition.row + 1,
          });
        }
      }

      // Require calls: require('module')
      if (
        node.type === "call_expression" &&
        node.firstChild?.text === "require"
      ) {
        const source = this.extractStringLiteral(node, content);
        if (source) {
          imports.push({
            source,
            type: "require",
            lineNumber: node.startPosition.row + 1,
          });
        }
      }
    });

    return imports;
  }

  private parseImportStatement(
    node: Parser.SyntaxNode,
    _content: string
  ): ImportStatement | null {
    const sourceNode = node.descendantsOfType("string")[0];
    if (!sourceNode) return null;

    const source = this.cleanStringLiteral(sourceNode.text);
    const lineNumber = node.startPosition.row + 1;

    // Determine import type and extract identifiers
    const importClause = node.childForFieldName("import_clause");

    if (!importClause) {
      // Side-effect import: import './styles.css'
      return { source, type: "side-effect", lineNumber };
    }

    const identifiers: string[] = [];
    let type: ImportType = "named";

    // Check for namespace import: import * as Foo from './foo'
    const namespaceImport = importClause.descendantsOfType(
      "namespace_import"
    )[0];
    if (namespaceImport) {
      const identifier = namespaceImport.descendantsOfType("identifier")[0];
      if (identifier) {
        identifiers.push(identifier.text);
      }
      type = "namespace";
    }

    // Check for default import: import Foo from './foo'
    const defaultImport = importClause.childForFieldName("default");
    if (defaultImport) {
      identifiers.push(defaultImport.text);
      type = "default";
    }

    // Check for named imports: import { Foo, Bar } from './foo'
    const namedImports = importClause.descendantsOfType("named_imports")[0];
    if (namedImports) {
      const importSpecifiers = namedImports.descendantsOfType(
        "import_specifier"
      );
      importSpecifiers.forEach((spec) => {
        const nameNode = spec.childForFieldName("name");
        if (nameNode) {
          identifiers.push(nameNode.text);
        }
      });
      // If there's also a default import, this is a mixed import
      if (type !== "default") {
        type = "named";
      }
    }

    return {
      source,
      type,
      identifiers: identifiers.length > 0 ? identifiers : undefined,
      lineNumber,
    };
  }

  private extractExportsFromTree(
    tree: Parser.Tree,
    content: string
  ): ExportStatement[] {
    const exports: ExportStatement[] = [];
    const rootNode = tree.rootNode;

    this.traverseNode(rootNode, (node) => {
      if (node.type === "export_statement") {
        const exportStmt = this.parseExportStatement(node, content);
        if (exportStmt) {
          exports.push(exportStmt);
        }
      }
    });

    return exports;
  }

  private parseExportStatement(
    node: Parser.SyntaxNode,
    _content: string
  ): ExportStatement | null {
    const identifiers: string[] = [];
    let source: string | undefined;
    let isDefault = false;
    const lineNumber = node.startPosition.row + 1;

    // Check for export default
    const defaultKeyword = node.children.find(
      (child) => child.type === "default"
    );
    isDefault = !!defaultKeyword;

    // Extract identifiers from various export patterns
    const declaration = node.childForFieldName("declaration");
    if (declaration) {
      // export function foo() {} or export const bar = ...
      this.extractIdentifiersFromDeclaration(declaration, identifiers);
    }

    // Check for re-exports: export { Foo } from './foo'
    const sourceNode = node.descendantsOfType("string")[0];
    if (sourceNode) {
      source = this.cleanStringLiteral(sourceNode.text);
    }

    // Named exports: export { Foo, Bar }
    const exportClause = node.descendantsOfType("export_clause")[0];
    if (exportClause) {
      const exportSpecifiers = exportClause.descendantsOfType(
        "export_specifier"
      );
      exportSpecifiers.forEach((spec) => {
        const nameNode = spec.childForFieldName("name");
        if (nameNode) {
          identifiers.push(nameNode.text);
        }
      });
    }

    // For default exports without identifiers, use "default"
    if (isDefault && identifiers.length === 0) {
      identifiers.push("default");
    }

    return {
      identifiers,
      source,
      isDefault,
      lineNumber,
    };
  }

  private extractIdentifiersFromDeclaration(
    declaration: Parser.SyntaxNode,
    identifiers: string[]
  ): void {
    // Function/class declarations
    if (
      declaration.type === "function_declaration" ||
      declaration.type === "class_declaration"
    ) {
      const nameNode = declaration.childForFieldName("name");
      if (nameNode) {
        identifiers.push(nameNode.text);
      }
    }

    // Variable declarations: const foo = ..., let bar = ...
    if (declaration.type === "lexical_declaration") {
      const declarators = declaration.descendantsOfType("variable_declarator");
      declarators.forEach((declarator) => {
        const nameNode = declarator.childForFieldName("name");
        if (nameNode) {
          identifiers.push(nameNode.text);
        }
      });
    }
  }

  private extractStringLiteral(
    node: Parser.SyntaxNode,
    _content: string
  ): string | null {
    const stringNode = node.descendantsOfType("string")[0];
    if (!stringNode) return null;
    return this.cleanStringLiteral(stringNode.text);
  }

  private cleanStringLiteral(text: string): string {
    // Remove quotes from string literals
    return text.replace(/^['"`](.*)['"`]$/, "$1");
  }

  private traverseNode(
    node: Parser.SyntaxNode,
    callback: (node: Parser.SyntaxNode) => void
  ): void {
    callback(node);
    for (const child of node.children) {
      this.traverseNode(child, callback);
    }
  }
}
