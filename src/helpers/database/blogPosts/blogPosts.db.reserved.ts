/**
 * Reserved / currently unused DB functions
 * Intentionally disabled for now.
 * Keep here as a reference for future admin controls, filtering, and post state management.
 */

// export const blogPostExistsById = async (id: string): Promise<boolean> => {
//   const result = await postgresPool.query(
//     `select 1
//      from ${TABLE_NAME}
//      where id = $1
//      limit 1`,
//     [id]
//   )

//   return result.rows.length > 0
// }

// export const slugExists = async (
//   slug: string,
//   excludeId?: string
// ): Promise<boolean> => {
//   const result = excludeId
//     ? await postgresPool.query(
//         `select 1
//          from ${TABLE_NAME}
//          where slug = $1
//            and id <> $2
//          limit 1`,
//         [slug, excludeId]
//       )
//     : await postgresPool.query(
//         `select 1
//          from ${TABLE_NAME}
//          where slug = $1
//          limit 1`,
//         [slug]
//       )

//   return result.rows.length > 0
// }

// export const publishedSlugExists = async (
//   slug: string,
//   excludeId?: string
// ): Promise<boolean> => {
//   const result = excludeId
//     ? await postgresPool.query(
//         `select 1
//          from ${TABLE_NAME}
//          where slug = $1
//            and ${PUBLIC_BLOG_POSTS_WHERE}
//            and id <> $2
//          limit 1`,
//         [slug, excludeId]
//       )
//     : await postgresPool.query(
//         `select 1
//          from ${TABLE_NAME}
//          where slug = $1
//             and ${PUBLIC_BLOG_POSTS_WHERE}
//          limit 1`,
//         [slug]
//       )

//   return result.rows.length > 0
// }

// export const listBlogPosts = async (
//   options: ListBlogPostsOptions = {}
// ): Promise<BlogPostFullRecord[]> => {
//   const { whereSql, values, nextIndex } = buildWhereClause(options)
//   const orderBySql = buildOrderByClause(options.orderField, options.orderDirection)

//   const limit =
//     options.limit && Number.isFinite(options.limit)
//       ? Math.max(1, Math.min(100, Number(options.limit)))
//       : null

//   const limitSql = limit ? `limit $${nextIndex}` : ''

//   const result = await postgresPool.query(
//     `select ${buildSelectClause('full')}
//      from ${TABLE_NAME}
//      ${whereSql}
//      ${orderBySql}
//      ${limitSql}`,
//     limit ? [...values, limit] : values
//   )

//   return result.rows.map(mapFullRow)
// }

// export const listBlogPostSeoRecords = async (
//   options: ListBlogPostsOptions = {}
// ): Promise<BlogPostSeoRecord[]> => {
//   const { whereSql, values, nextIndex } = buildWhereClause(options)
//   const orderBySql = buildOrderByClause(options.orderField, options.orderDirection)

//   const limit =
//     options.limit && Number.isFinite(options.limit)
//       ? Math.max(1, Math.min(100, Number(options.limit)))
//       : null

//   const limitSql = limit ? `limit $${nextIndex}` : ''

//   const result = await postgresPool.query(
//     `select ${buildSelectClause('seo')}
//      from ${TABLE_NAME}
//      ${whereSql}
//      ${orderBySql}
//      ${limitSql}`,
//     limit ? [...values, limit] : values
//   )

//   return result.rows.map(mapSeoRow)
// }

// export const listBlogPostSlugRecords = async (
//   options: ListBlogPostsOptions = {}
// ): Promise<BlogPostSlugRecord[]> => {
//   const { whereSql, values, nextIndex } = buildWhereClause(options)
//   const orderBySql = buildOrderByClause(options.orderField, options.orderDirection)

//   const limit =
//     options.limit && Number.isFinite(options.limit)
//       ? Math.max(1, Math.min(100, Number(options.limit)))
//       : null

//   const limitSql = limit ? `limit $${nextIndex}` : ''

//   const result = await postgresPool.query(
//     `select ${buildSelectClause('slugOnly')}
//      from ${TABLE_NAME}
//      ${whereSql}
//      ${orderBySql}
//      ${limitSql}`,
//     limit ? [...values, limit] : values
//   )

//   return result.rows.map(mapSlugRow)
// }

// export const listPublishedBlogPosts = async (): Promise<BlogPostRecord[]> => {
//   return listBlogPosts({ publishedOnly: true })
// }

// export const listFeaturedBlogPosts = async (): Promise<BlogPostRecord[]> => {
//   return listBlogPosts({
//     publishedOnly: true,
//     featuredOnly: true
//   })
// }

// export const listBlogPostsByTag = async (
//   tag: string,
//   options: Omit<ListBlogPostsOptions, 'tag'> = {}
// ): Promise<BlogPostRecord[]> => {
//   return listBlogPosts({
//     ...options,
//     tag
//   })
// }

// export const listBlogPostsByAuthor = async (
//   author: string,
//   options: Omit<ListBlogPostsOptions, 'author'> = {}
// ): Promise<BlogPostRecord[]> => {
//   return listBlogPosts({
//     ...options,
//     author
//   })
// }

// export const countBlogPosts = async (
//   options: ListBlogPostsOptions = {}
// ): Promise<number> => {
//   const { whereSql, values } = buildWhereClause(options)

//   const result = await postgresPool.query<{ total: string }>(
//     `select count(*)::text as total
//      from ${TABLE_NAME}
//      ${whereSql}`,
//     values
//   )

//   return Number(result.rows[0]?.total ?? 0)
// }

// export const listBlogPostsPaginated = async (
//   options: ListBlogPostsOptions = {}
// ): Promise<PaginatedResult<BlogPostRecord>> => {
//   const page = Math.max(1, Number(options.page ?? 1))
//   const pageSize = Math.max(1, Math.min(100, Number(options.pageSize ?? 10)))
//   const offset = (page - 1) * pageSize

//   const { whereSql, values, nextIndex } = buildWhereClause(options)
//   const orderBySql = buildOrderByClause(options.orderField, options.orderDirection)

//   const countResult = await postgresPool.query<{ total: string }>(
//     `select count(*)::text as total
//      from ${TABLE_NAME}
//      ${whereSql}`,
//     values
//   )

//   const totalItems = Number(countResult.rows[0]?.total ?? 0)
//   const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

//   const paginatedValues = [...values, pageSize, offset]

//   const result = await postgresPool.query(
//     `select ${buildSelectClause('full')}
//      from ${TABLE_NAME}
//      ${whereSql}
//      ${orderBySql}
//      limit $${nextIndex}
//      offset $${nextIndex + 1}`,
//     paginatedValues
//   )

//   return {
//     data: result.rows.map(mapFullRow),
//     pagination: {
//       currentPage: page,
//       pageSize,
//       hasNextPage: page < totalPages,
//       hasPreviousPage: page > 1,
//       totalPages,
//       totalItems
//     }
//   }
// }

// export const setBlogPostDraftStatus = async (
//   id: string,
//   draft: boolean
// ): Promise<BlogPostRecord | null> => {
//   const result = await postgresPool.query(
//     `update ${TABLE_NAME}
//      set
//        draft = $2,
//        published = case when $2 = true then false else published end,
//        publish_timestamp = case when $2 = true then null else publish_timestamp end,
//        updated_at = now()
//      where id = $1
//      returning *`,
//     [id, draft]
//   )

//   if (!result.rows.length) return null
//   return mapFullRow(result.rows[0])
// }

// export const toggleBlogPostDraft = async (
//   id: string
// ): Promise<BlogPostRecord | null> => {
//   const current = await getBlogPostById(id)

//   if (!current) return null

//   return setBlogPostDraftStatus(id, !current.draft)
// }

// export const setBlogPostFeaturedStatus = async (
//   id: string,
//   featured: boolean
// ): Promise<BlogPostRecord | null> => {
//   const result = await postgresPool.query(
//     `update ${TABLE_NAME}
//      set
//        featured = $2,
//        updated_at = now()
//      where id = $1
//      returning *`,
//     [id, featured]
//   )

//   if (!result.rows.length) return null
//   return mapFullRow(result.rows[0])
// }

// export const toggleBlogPostFeatured = async (
//   id: string
// ): Promise<BlogPostRecord | null> => {
//   const result = await postgresPool.query(
//     `update ${TABLE_NAME}
//      set
//        featured = not featured,
//        updated_at = now()
//      where id = $1
//      returning *`,
//     [id]
//   )

//   if (!result.rows.length) return null
//   return mapFullRow(result.rows[0])
// }

// export const setBlogPostStaffPickStatus = async (
//   id: string,
//   staffPick: boolean
// ): Promise<BlogPostRecord | null> => {
//   const result = await postgresPool.query(
//     `update ${TABLE_NAME}
//      set
//        staff_pick = $2,
//        updated_at = now()
//      where id = $1
//      returning *`,
//     [id, staffPick]
//   )

//   if (!result.rows.length) return null
//   return mapFullRow(result.rows[0])
// }

// export const toggleBlogPostStaffPick = async (
//   id: string
// ): Promise<BlogPostRecord | null> => {
//   const result = await postgresPool.query(
//     `update ${TABLE_NAME}
//      set
//        staff_pick = not staff_pick,
//        updated_at = now()
//      where id = $1
//      returning *`,
//     [id]
//   )

//   if (!result.rows.length) return null
//   return mapFullRow(result.rows[0])
// }