import type { DatabaseSchemaModule } from '../schema.types'

export const BLOG_POSTS_TABLE = 'blog_posts'

export const blogPostsSchema: DatabaseSchemaModule = {
  key: 'blog_posts',
  description: 'Blog posts stored in PostgreSQL for admin management and public website rendering.',
  statements: [
    `create table if not exists ${BLOG_POSTS_TABLE} (
      id text primary key,

      slug text not null,
      title text not null,
      summary text not null default '',
      content text not null default '',

      author text not null default '',
      tags text[] not null default '{}',

      thumbnail text not null default '',
      thumbnail_alt text not null default '',
      thumbnail_width integer,
      thumbnail_height integer,

      staff_pick boolean not null default false,
      featured boolean not null default false,

      read_time integer not null default 0 check (read_time >= 0),

      draft boolean not null default true,
      published boolean not null default false,
      publish_timestamp timestamptz,

      seo_title text not null default '',
      seo_description text not null default '',
      seo_image text not null default '',
      canonical_url text not null default '' check (canonical_url = '' or canonical_url ~* '^https?://'),

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );`,

    `create unique index if not exists idx_blog_posts_slug_unique
      on ${BLOG_POSTS_TABLE} (slug);`,

    `create index if not exists idx_blog_posts_published
      on ${BLOG_POSTS_TABLE} (published);`,

    `create index if not exists idx_blog_posts_draft
      on ${BLOG_POSTS_TABLE} (draft);`,

    `create index if not exists idx_blog_posts_publish_timestamp
      on ${BLOG_POSTS_TABLE} (publish_timestamp desc);`,

    `create index if not exists idx_blog_posts_staff_pick
      on ${BLOG_POSTS_TABLE} (staff_pick);`,

    `create index if not exists idx_blog_posts_featured
      on ${BLOG_POSTS_TABLE} (featured);`,

    `create index if not exists idx_blog_posts_created_at
      on ${BLOG_POSTS_TABLE} (created_at desc);`,

    `create index if not exists idx_blog_posts_updated_at
      on ${BLOG_POSTS_TABLE} (updated_at desc);`,

    `create index if not exists idx_blog_posts_author
      on ${BLOG_POSTS_TABLE} (author);`,

    `create index if not exists idx_blog_posts_read_time
      on ${BLOG_POSTS_TABLE} (read_time);`,

    `create index if not exists idx_blog_posts_tags_gin
      on ${BLOG_POSTS_TABLE} using gin (tags);`,

    `drop trigger if exists trg_blog_posts_manage_timestamps
      on ${BLOG_POSTS_TABLE};`,

    `create trigger trg_blog_posts_manage_timestamps
      before insert or update on ${BLOG_POSTS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}