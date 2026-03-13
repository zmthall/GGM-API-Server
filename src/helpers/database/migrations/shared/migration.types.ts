export interface MigrationResult {
  migration: string
  sourceCollection: string
  fetchedCount: number
  migratedCount: number
  skippedCount: number
  errors: string[]
}