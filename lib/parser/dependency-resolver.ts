import * as path from "path";
import * as fs from "fs/promises";

/**
 * Configuration for path resolution
 */
export interface ResolverConfig {
  /** Root directory of the repository */
  repoRoot: string;
  /** Path aliases from tsconfig.json (e.g., { "@/*": ["src/*"] }) */
  pathAliases?: Record<string, string[]>;
  /** Extensions to try when resolving imports */
  extensions?: string[];
}

/**
 * Resolves import paths to absolute file paths
 */
export class DependencyResolver {
  private config: Required<ResolverConfig>;

  constructor(config: ResolverConfig) {
    this.config = {
      repoRoot: config.repoRoot,
      pathAliases: config.pathAliases || {},
      extensions: config.extensions || [
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
      ],
    };
  }

  /**
   * Resolve an import source to an absolute file path
   * @param source - Import source (e.g., './utils', '@/lib/helpers', 'react')
   * @param fromFile - Absolute path of the file containing the import
   * @returns Absolute path to the imported file, or null if it's external/unresolvable
   */
  async resolveImport(
    source: string,
    fromFile: string
  ): Promise<string | null> {
    // Skip external packages (node_modules)
    if (this.isExternalPackage(source)) {
      return null;
    }

    // Try path alias resolution first
    const aliasResolved = await this.resolvePathAlias(source);
    if (aliasResolved) {
      return aliasResolved;
    }

    // Resolve relative imports
    if (this.isRelativeImport(source)) {
      return this.resolveRelativeImport(source, fromFile);
    }

    // Absolute imports from repo root
    return this.resolveAbsoluteImport(source);
  }

  /**
   * Check if import is an external package
   */
  private isExternalPackage(source: string): boolean {
    // External packages don't start with . or /
    // and don't match any path aliases
    if (source.startsWith(".") || source.startsWith("/")) {
      return false;
    }

    // Check if it matches any path alias patterns
    for (const alias of Object.keys(this.config.pathAliases)) {
      const pattern = alias.replace("/*", "");
      if (source.startsWith(pattern)) {
        return false;
      }
    }

    // It's an external package (e.g., 'react', 'lodash')
    return true;
  }

  /**
   * Check if import is relative
   */
  private isRelativeImport(source: string): boolean {
    return source.startsWith("./") || source.startsWith("../");
  }

  /**
   * Resolve relative imports
   */
  private async resolveRelativeImport(
    source: string,
    fromFile: string
  ): Promise<string | null> {
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, source);
    return this.resolveFilePath(resolved);
  }

  /**
   * Resolve absolute imports from repo root
   */
  private async resolveAbsoluteImport(source: string): Promise<string | null> {
    const resolved = path.resolve(this.config.repoRoot, source);
    return this.resolveFilePath(resolved);
  }

  /**
   * Resolve path aliases (e.g., @/lib/helpers -> src/lib/helpers)
   */
  private async resolvePathAlias(source: string): Promise<string | null> {
    for (const [alias, targets] of Object.entries(this.config.pathAliases)) {
      const aliasPattern = alias.replace("/*", "");

      if (source.startsWith(aliasPattern)) {
        // Replace alias with each target and try to resolve
        for (const target of targets) {
          const targetPattern = target.replace("/*", "");
          const relativePath = source.replace(aliasPattern, targetPattern);
          const resolved = path.resolve(this.config.repoRoot, relativePath);
          const filePath = await this.resolveFilePath(resolved);
          if (filePath) {
            return filePath;
          }
        }
      }
    }

    return null;
  }

  /**
   * Try to resolve a file path by checking various extensions and index files
   */
  private async resolveFilePath(basePath: string): Promise<string | null> {
    // Try exact path first
    if (await this.fileExists(basePath)) {
      return basePath;
    }

    // Try with extensions
    for (const ext of this.config.extensions) {
      const pathWithExt = basePath + ext;
      if (await this.fileExists(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Try as directory with index file
    for (const ext of this.config.extensions) {
      const indexPath = path.join(basePath, `index${ext}`);
      if (await this.fileExists(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Load path aliases from tsconfig.json
   */
  static async loadTsConfig(repoRoot: string): Promise<ResolverConfig> {
    const tsconfigPath = path.join(repoRoot, "tsconfig.json");

    try {
      const content = await fs.readFile(tsconfigPath, "utf-8");
      const tsconfig = JSON.parse(content);

      const pathAliases: Record<string, string[]> = {};

      if (tsconfig.compilerOptions?.paths) {
        for (const [alias, targets] of Object.entries(
          tsconfig.compilerOptions.paths
        )) {
          pathAliases[alias] = targets as string[];
        }
      }

      return {
        repoRoot,
        pathAliases,
      };
    } catch (error) {
      // If tsconfig.json doesn't exist or can't be parsed, return basic config
      console.warn(`Could not load tsconfig.json from ${repoRoot}:`, error);
      return { repoRoot };
    }
  }
}
