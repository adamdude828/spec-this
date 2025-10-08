import * as fs from "fs/promises";
import * as path from "path";
import { TypeScriptParser } from "./typescript-parser";
import {
  DependencyResolver,
  type ResolverConfig,
} from "./dependency-resolver";
import { type FileNode, type DependencyEdge, type ParsedFile } from "./types";

/**
 * Configuration for file indexing
 */
export interface IndexerConfig {
  /** Repository ID */
  repoId: string;
  /** Root directory of the repository */
  repoRoot: string;
  /** Directories to ignore */
  ignoreDirs?: string[];
  /** File patterns to ignore */
  ignorePatterns?: RegExp[];
}

/**
 * Result of indexing a repository
 */
export interface IndexResult {
  /** File nodes discovered */
  files: FileNode[];
  /** Dependency edges between files */
  dependencies: DependencyEdge[];
  /** Statistics about the indexing */
  stats: {
    filesProcessed: number;
    dependenciesFound: number;
    errors: string[];
  };
}

/**
 * Service for indexing repositories and building dependency graphs
 */
export class FileIndexer {
  private config: Required<IndexerConfig>;
  private parser: TypeScriptParser;
  private resolver: DependencyResolver;

  constructor(config: IndexerConfig, resolverConfig?: ResolverConfig) {
    this.config = {
      repoId: config.repoId,
      repoRoot: config.repoRoot,
      ignoreDirs: config.ignoreDirs || [
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        "coverage",
        ".turbo",
      ],
      ignorePatterns: config.ignorePatterns || [
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/,
        /\.d\.ts$/,
      ],
    };

    this.parser = new TypeScriptParser();

    // If no resolver config provided, create basic one
    this.resolver = new DependencyResolver(
      resolverConfig || { repoRoot: config.repoRoot }
    );
  }

  /**
   * Index the entire repository
   */
  async indexRepository(): Promise<IndexResult> {
    const files: FileNode[] = [];
    const dependencies: DependencyEdge[] = [];
    const errors: string[] = [];

    console.log(`📂 Indexing repository: ${this.config.repoRoot}`);

    // Discover all source files
    const filePaths = await this.discoverFiles(this.config.repoRoot);
    console.log(`📄 Found ${filePaths.length} files to process`);

    // Process each file
    for (const filePath of filePaths) {
      try {
        await this.processFile(filePath, files, dependencies);
      } catch (error) {
        const errorMsg = `Failed to process ${filePath}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      files,
      dependencies,
      stats: {
        filesProcessed: files.length,
        dependenciesFound: dependencies.length,
        errors,
      },
    };
  }

  /**
   * Process a single file
   */
  private async processFile(
    filePath: string,
    files: FileNode[],
    dependencies: DependencyEdge[]
  ): Promise<void> {
    const content = await fs.readFile(filePath, "utf-8");
    const ext = path.extname(filePath);
    const relativePath = path.relative(this.config.repoRoot, filePath);

    // Create file node
    const fileNode: FileNode = {
      filePath,
      repoId: this.config.repoId,
      language: this.getLanguageFromExtension(ext),
      extension: ext,
      relativePath,
    };
    files.push(fileNode);

    // Parse file to extract imports
    const parsed: ParsedFile = await this.parser.parseFile(filePath, content);

    // Resolve each import to a file path
    for (const importStmt of parsed.imports) {
      try {
        const resolvedPath = await this.resolver.resolveImport(
          importStmt.source,
          filePath
        );

        if (resolvedPath) {
          // Only create dependency if resolved path is within the repository
          if (resolvedPath.startsWith(this.config.repoRoot)) {
            dependencies.push({
              from: filePath,
              to: resolvedPath,
              importType: importStmt.type,
              lineNumber: importStmt.lineNumber,
            });
          }
        }
      } catch (error) {
        // Log resolution errors but continue
        console.warn(
          `Could not resolve import "${importStmt.source}" in ${filePath}:`,
          error
        );
      }
    }
  }

  /**
   * Recursively discover all source files in the repository
   */
  private async discoverFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip ignored directories
        if (this.shouldIgnoreDir(entry.name)) {
          continue;
        }
        // Recursively process subdirectory
        const subFiles = await this.discoverFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Check if file should be processed
        if (this.shouldProcessFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Check if directory should be ignored
   */
  private shouldIgnoreDir(dirName: string): boolean {
    return this.config.ignoreDirs.includes(dirName);
  }

  /**
   * Check if file should be processed
   */
  private shouldProcessFile(filePath: string): boolean {
    const ext = path.extname(filePath);

    // Check if extension is supported
    if (!this.parser.supportedExtensions.includes(ext)) {
      return false;
    }

    // Check against ignore patterns
    for (const pattern of this.config.ignorePatterns) {
      if (pattern.test(filePath)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get language name from file extension
   */
  private getLanguageFromExtension(ext: string): string {
    switch (ext) {
      case ".ts":
      case ".tsx":
        return "typescript";
      case ".js":
      case ".jsx":
      case ".mjs":
      case ".cjs":
        return "javascript";
      default:
        return "unknown";
    }
  }

  /**
   * Create a file indexer with automatically loaded tsconfig
   */
  static async create(config: IndexerConfig): Promise<FileIndexer> {
    // Try to load tsconfig for path resolution
    const resolverConfig = await DependencyResolver.loadTsConfig(
      config.repoRoot
    );
    return new FileIndexer(config, resolverConfig);
  }
}
