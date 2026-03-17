import { correspondenceCountsSchema } from './adminMeta/correspondenceCounts.schema'
import { blogCalendarsSchema } from './blogCalendars/blogCalendars.schema'
import { contactMessagesSchema } from './contactMessages/contactMessages.schema'
import { usersSchema } from './users/users.schema'
import { eventsSchema } from './events/events.schema'
import { jobDescriptionsSchema } from './jobDescriptions/jobDescriptions.schema'
import { rideRequestsSchema } from './rideRequests/rideRequests.schema'
import type { DatabaseSchemaModule } from './schema.types'
import { jobApplicationsSchema } from './jobApplications/jobApplications.schema'
import { blogPostsSchema } from './blogPosts/blogPosts.schema'

export const databaseSchemaModules: DatabaseSchemaModule[] = [
  correspondenceCountsSchema,
  blogCalendarsSchema,
  jobDescriptionsSchema,
  usersSchema,
  eventsSchema,
  contactMessagesSchema,
  rideRequestsSchema,
  jobApplicationsSchema,
  blogPostsSchema
]

export * from './schema.types'
export * from './adminMeta/correspondenceCounts.schema'
export * from './blogCalendars/blogCalendars.schema'
export * from './jobDescriptions/jobDescriptions.schema'
export * from './users/users.schema'
export * from './events/events.schema'
export * from './contactMessages/contactMessages.schema'
export * from './rideRequests/rideRequests.schema'
export * from './jobApplications/jobApplications.schema'
export * from './blogPosts/blogPosts.schema'