/**
 * Reserved / currently unused controller handlers
 * Intentionally disabled for now.
 * Keep here as a reference for future admin controls, filtering, and post state management.
 */

// async setDraft(req: Request, res: Response): Promise<void> {
//   try {
//     const draft = toOptionalBoolean(req.body.draft)

//     if (draft === undefined) {
//       res.status(400).json({
//         success: false,
//         message: 'draft boolean is required.'
//       })
//       return
//     }

//     const result = await blogPostsService.setDraftStatus(req.params.id, draft)

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: 'Blog post not found.'
//       })
//       return
//     }

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update draft status.',
//       error
//     })
//   }
// }

// async toggleDraft(req: Request, res: Response): Promise<void> {
//   try {
//     const result = await blogPostsService.toggleDraft(req.params.id)

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: 'Blog post not found.'
//       })
//       return
//     }

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to toggle draft status.',
//       error
//     })
//   }
// }

// async setFeatured(req: Request, res: Response): Promise<void> {
//   try {
//     const featured = toOptionalBoolean(req.body.featured)

//     if (featured === undefined) {
//       res.status(400).json({
//         success: false,
//         message: 'featured boolean is required.'
//       })
//       return
//     }

//     const result = await blogPostsService.setFeaturedStatus(req.params.id, featured)

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: 'Blog post not found.'
//       })
//       return
//     }

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update featured status.',
//       error
//     })
//   }
// }

// async toggleFeatured(req: Request, res: Response): Promise<void> {
//   try {
//     const result = await blogPostsService.toggleFeatured(req.params.id)

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: 'Blog post not found.'
//       })
//       return
//     }

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to toggle featured status.',
//       error
//     })
//   }
// }

// async setStaffPick(req: Request, res: Response): Promise<void> {
//   try {
//     const staffPick = toOptionalBoolean(req.body.staffPick)

//     if (staffPick === undefined) {
//       res.status(400).json({
//         success: false,
//         message: 'staffPick boolean is required.'
//       })
//       return
//     }

//     const result = await blogPostsService.setStaffPickStatus(req.params.id, staffPick)

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: 'Blog post not found.'
//       })
//       return
//     }

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update staff pick status.',
//       error
//     })
//   }
// }

// async toggleStaffPick(req: Request, res: Response): Promise<void> {
//   try {
//     const result = await blogPostsService.toggleStaffPick(req.params.id)

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: 'Blog post not found.'
//       })
//       return
//     }

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to toggle staff pick status.',
//       error
//     })
//   }
// }

// async existsById(req: Request, res: Response): Promise<void> {
//   try {
//     const result = await blogPostsService.existsById(req.params.id)

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to check blog post existence by id.',
//       error
//     })
//   }
// }

// async existsBySlug(req: Request, res: Response): Promise<void> {
//   try {
//     const excludeId = toOptionalString(req.query.excludeId)
//     const result = await blogPostsService.existsBySlug(req.params.slug, excludeId)

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to check blog post existence by slug.',
//       error
//     })
//   }
// }

// async existsPublishedBySlug(req: Request, res: Response): Promise<void> {
//   try {
//     const excludeId = toOptionalString(req.query.excludeId)
//     const result = await blogPostsService.existsPublishedBySlug(req.params.slug, excludeId)

//     res.status(200).json({
//       success: true,
//       data: result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to check blog post existence by slug.',
//       error
//     })
//   }
// }

// async list(req: Request, res: Response): Promise<void> {
//   try {
//     const posts = await blogPostsService.list(parseListOptions(req))

//     res.status(200).json({
//       success: true,
//       data: posts
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to list blog posts.',
//       error
//     })
//   }
// }

// async listPaginated(req: Request, res: Response): Promise<void> {
//   try {
//     const result = await blogPostsService.listPaginated(parseListOptions(req))

//     res.status(200).json({
//       success: true,
//       ...result
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to list paginated blog posts.',
//       error
//     })
//   }
// }

// async listPublished(req: Request, res: Response): Promise<void> {
//   try {
//     const result = await blogPostsService.listPublishedCardsPaginated(parseListOptions(req))

//     res.status(200).json({
//       success: true,
//       data: result.data,
//       pagination: result.pagination
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to list published blog posts.',
//       error
//     })
//   }
// }

// async listFeatured(req: Request, res: Response): Promise<void> {
//   try {
//     const posts = await blogPostsService.listFeatured()

//     res.status(200).json({
//       success: true,
//       data: posts
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to list featured blog posts.',
//       error
//     })
//   }
// }

// async listByTag(req: Request, res: Response): Promise<void> {
//   try {
//     const options = parseListOptions(req)
//     delete options.tag

//     const posts = await blogPostsService.listByTag(req.params.tag, options)

//     res.status(200).json({
//       success: true,
//       data: posts
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to list blog posts by tag.',
//       error
//     })
//   }
// }

// async listByAuthor(req: Request, res: Response): Promise<void> {
//   try {
//     const options = parseListOptions(req)
//     delete options.author

//     const posts = await blogPostsService.listByAuthor(req.params.author, options)

//     res.status(200).json({
//       success: true,
//       data: posts
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to list blog posts by author.',
//       error
//     })
//   }
// }

// async count(req: Request, res: Response): Promise<void> {
//   try {
//     const total = await blogPostsService.count(parseListOptions(req))

//     res.status(200).json({
//       success: true,
//       data: {
//         total
//       }
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to count blog posts.',
//       error
//     })
//   }
// }