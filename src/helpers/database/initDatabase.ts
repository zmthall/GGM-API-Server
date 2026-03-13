import { postgresPool } from '../../config/postgres'
import { databaseSchemaModules } from './schema'

const bootstrapStatements = [
  `create or replace function manage_row_timestamps()
    returns trigger
    as $$
    begin
      if tg_op = 'INSERT' then
        new.created_at = coalesce(new.created_at, now());
        new.updated_at = coalesce(new.updated_at, now());
        return new;
      end if;

      if tg_op = 'UPDATE' then
        new.created_at = old.created_at;
        new.updated_at = now();
        return new;
      end if;

      return new;
    end;
    $$ language plpgsql;`
]

export const initDatabase = async (): Promise<void> => {
  const client = await postgresPool.connect()

  try {
    await client.query('begin')

    for (const statement of bootstrapStatements) {
      await client.query(statement)
    }

    for (const schemaModule of databaseSchemaModules) {
      for (const statement of schemaModule.statements) {
        await client.query(statement)
      }
    }

    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}