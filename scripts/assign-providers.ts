/* eslint-disable no-console */
/**
 * Script to assign providers to existing repositories based on their repoUrl
 */

import 'dotenv/config';
import { db } from '../lib/db/index';
import { repositories, providers } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function assignProviders() {
  console.log('Starting provider assignment for existing repositories...');

  try {
    // Fetch all providers
    const allProviders = await db.select().from(providers);
    console.log(`Found ${allProviders.length} providers`);

    const providerMap = new Map(allProviders.map(p => [p.code, p]));

    // Fetch repositories without a provider
    const reposWithoutProvider = await db
      .select()
      .from(repositories)
      .where(isNull(repositories.providerId));

    console.log(`Found ${reposWithoutProvider.length} repositories without a provider`);

    let updated = 0;

    for (const repo of reposWithoutProvider) {
      if (!repo.repoUrl) {
        console.log(`Skipping ${repo.name} - no repoUrl`);
        continue;
      }

      const url = repo.repoUrl.toLowerCase();
      let providerCode: 'github' | 'azure_devops' | 'gitlab' | 'bitbucket' | null = null;

      if (url.includes('github.com')) {
        providerCode = 'github';
      } else if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) {
        providerCode = 'azure_devops';
      } else if (url.includes('gitlab.com') || url.includes('gitlab.')) {
        providerCode = 'gitlab';
      } else if (url.includes('bitbucket.org') || url.includes('bitbucket.')) {
        providerCode = 'bitbucket';
      }

      if (providerCode) {
        const provider = providerMap.get(providerCode);
        if (provider) {
          await db
            .update(repositories)
            .set({ providerId: provider.id })
            .where(eq(repositories.id, repo.id));

          console.log(`Updated ${repo.name} -> ${provider.name}`);
          updated++;
        }
      } else {
        console.log(`Could not detect provider for ${repo.name} (${repo.repoUrl})`);
      }
    }

    console.log(`\nProvider assignment complete! Updated ${updated} repositories.`);
  } catch (error) {
    console.error('Error assigning providers:', error);
    process.exit(1);
  }

  process.exit(0);
}

assignProviders();
