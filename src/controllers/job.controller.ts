import * as jobService from '../services/job.services';
import { Request, Response } from 'express';

export const getJobDescriptionByField = async (req: Request, res: Response) => {
  try {
    const field = Object.keys(req.params).join()

    if(field === 'select') {
        const field_value = Object.values(req.params).join()
        
        const jobDescription = await jobService.getJobDescription(field, field_value);
        
        if (!jobDescription) {
          res.status(404).json({
            success: false,
            message: 'Job description not found'
          });
    
          return;
        }
        
        res.json({
          success: true,
          data: jobDescription
        });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });

    return;
  }
}