import { getJobDescriptionByField, type JobDescriptionField } from '../helpers/database/jobDescriptions/jobDescriptions.db'
import { JobDescription } from '../types/jobs'

export const getJobDescription = async (field: JobDescriptionField, field_value: string) => {
  try {
    const jobDescription = await getJobDescriptionByField(field, field_value)

    if (!jobDescription) {
      return null
    }

    return {
      ...jobDescription,
      qualifications: jobDescription.qualifications ? jobDescription.qualifications.split('\n') : [],
      shifts: jobDescription.shifts ? jobDescription.shifts.split('\n') : [],
      responsibilities: jobDescription.responsibilities ? jobDescription.responsibilities.split('\n') : []
    } as JobDescription
  } catch (error) {
    throw new Error(`Failed to get job description: ${(error as Error).message}`)
  }
}