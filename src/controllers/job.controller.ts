import * as jobService from '../services/job.services'
import { Request, Response } from 'express'
import type { JobDescriptionField } from '../helpers/database/jobDescriptions/jobDescriptions.db'

export const getJobDescriptionByField = async (req: Request, res: Response) => {
  try {
    let field: JobDescriptionField | null = null
    let fieldValue: string | null = null

    if (typeof req.params.select === 'string') {
      field = 'select_label'
      fieldValue = req.params.select
    }

    if (!field || !fieldValue) {
      res.status(400).json({
        success: false,
        message: 'Invalid job description lookup field.'
      })
      return
    }

    const jobDescription = await jobService.getJobDescription(field, fieldValue)

    if (!jobDescription) {
      res.status(404).json({
        success: false,
        message: 'Job description not found'
      })
      return
    }

    res.json({
      success: true,
      data: jobDescription
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}