import type { DatabaseSchemaModule } from '../schema.types'

export const BLOG_POSTS_TABLE = 'blog_posts'

export const blogPostsSchema: DatabaseSchemaModule = {
  key: 'blog_posts',
  description: 'Markdown blog posts migrated from Nuxt Content into PostgreSQL.',
  statements: [
    `create table if not exists ${BLOG_POSTS_TABLE} (
      id text primary key,

      slug text not null,
      title text not null,
      description text not null default '',
      summary text not null default '',
      author text not null default '',

      draft boolean not null default false,
      staff_pick boolean not null default false,

      date timestamptz,
      published date,
      read_time integer not null default 0 check (read_time >= 0),

      thumbnail text not null default '',
      thumbnail_alt text not null default '',
      thumbnail_width integer,
      thumbnail_height integer,

      body_markdown text not null default '',
      source_file text not null default '',

      source_file_path text not null default '',
      source_content_id text not null default '',
      source_path text not null default '',

      tags text[] not null default '{}',

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      raw_frontmatter jsonb not null default '{}'::jsonb,
      raw_document jsonb not null default '{}'::jsonb
    );`,

    `create unique index if not exists idx_blog_posts_slug_unique
      on ${BLOG_POSTS_TABLE} (slug);`,

    `create index if not exists idx_blog_posts_published
      on ${BLOG_POSTS_TABLE} (published desc);`,

    `create index if not exists idx_blog_posts_date
      on ${BLOG_POSTS_TABLE} (date desc);`,

    `create index if not exists idx_blog_posts_draft
      on ${BLOG_POSTS_TABLE} (draft);`,

    `create index if not exists idx_blog_posts_staff_pick
      on ${BLOG_POSTS_TABLE} (staff_pick);`,

    `drop trigger if exists trg_blog_posts_manage_timestamps
      on ${BLOG_POSTS_TABLE};`,

    `create trigger trg_blog_posts_manage_timestamps
      before insert or update on ${BLOG_POSTS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}