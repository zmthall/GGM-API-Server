// /services/job.services.ts
import { getFirstDocumentByField } from "../helpers/firebase";
import { JobDescription } from "../types/jobs";

export const getJobDescription = async (field: string, field_value: string) => {
      try {
        const jobDescription = await getFirstDocumentByField('job_descriptions', field, field_value);
        
        if (!jobDescription) {
          return null;
        }
        
        jobDescription.qualifications = jobDescription.qualifications.split('\n');
        jobDescription.shifts = jobDescription.shifts.split('\n');
        jobDescription.responsibilities = jobDescription.responsibilities.split('\n');

        return jobDescription as JobDescription;
      } catch (error) {
        throw new Error(`Failed to get job description: ${(error as Error).message}`);
      }
}