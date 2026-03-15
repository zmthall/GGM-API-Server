import * as rideRequestService from '../services/rideRequest.services'
import type { Request, Response } from 'express'

export const submitRideRequestForm = async (req: Request, res: Response) => {
  try {
    const rideData = req.body

    const requiredFields = [
      'name',
      'dob',
      'phone',
      'email',
      'med_id',
      'pickup_address',
      'dropoff_address'
    ]

    const missingFields = requiredFields.filter(field => !rideData[field])

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
      return
    }

    const results = await rideRequestService.submitRideRequestForm(rideData)

    res.status(200).json({
      success: true,
      message: results.emailSuccess
        ? 'Ride request submitted successfully'
        : 'Ride request saved, but email failed to send',
      emailSuccess: results.emailSuccess,
      messageId: results.messageId,
      emailError: results.emailError,
      rideRequestId: results.documentId
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    })
  }
}

export const getAllRideRequests = async (req: Request, res: Response) => {
  try {
    const omit = req.query.omit !== 'false'
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize = Number.parseInt(req.query.limit as string) || Number.parseInt(req.query.pageSize as string) || 5

    const filters = {
      ...(req.query.status ? { status: req.query.status as string } : {}),
      ...(req.query.contact_type ? { contact_type: req.query.contact_type as string } : {})
    }

    const result = await rideRequestService.getAllRideRequests(filters, omit, { page, pageSize })

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

export const getRideRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await rideRequestService.getRideRequestById(id)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const getRideRequestsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize = Number.parseInt(req.query.limit as string) || Number.parseInt(req.query.pageSize as string) || 5

    const filters = {
      ...(req.query.status ? { status: req.query.status as string } : {}),
      ...(req.query.contact_type ? { contact_type: req.query.contact_type as string } : {})
    }

    const result = await rideRequestService.getRideRequestsByDate(date, filters, { page, pageSize })

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

export const updateRideRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required'
      })
      return
    }

    const result = await rideRequestService.updateRideRequestStatus(id, status)

    res.json({
      success: true,
      data: result,
      message: 'Ride request status updated successfully'
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const updateRideRequestTags = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tags } = req.body

    if (!Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      })
      return
    }

    const result = await rideRequestService.updateRideRequestTags(id, tags)

    res.json({
      success: true,
      data: result,
      message: 'Ride request tags updated successfully'
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const deleteRideRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await rideRequestService.deleteRideRequest(id)

    res.json({
      success: true,
      message: 'Ride request deleted successfully'
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const createRideRequestPDFById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const pdfBuffer = await rideRequestService.createRideRequestPDFById(id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="ride-request-${id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const createRideRequestPDFBulk = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ids must be a non-empty array'
      })
      return
    }

    const zipBuffer = await rideRequestService.createRideRequestPDFBulk(ids)

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="ride-requests.zip"')
    res.send(zipBuffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}