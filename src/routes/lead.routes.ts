// /routes/lead.routes.ts
import { Router } from 'express';
import {
    getLeads,
    getLeadsByDate,
    getLeadsByDateRange,
    // searchLeads,
    getLeadsByStatus,
    getLeadsByFilters,
    // getLeadStats,
    createLead,
    createMultipleLeads,
    // createLeadPDFAll,
    // createLeadPDF,
    updateLead,
    updateLeadTag,
    updateLeadStatus,
    updateLeadStatusBulk,
    deleteLead
} from '../controllers/lead.controller';

// Middleware
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';

const router = Router();


// Administrative API Calls, requires firebaseToken for authentication
// GET - http://127.0.0.1:4000/api/leads | Gets all leads from the firebase firestore
// GET - http://127.0.0.1:4000/api/leads/:date | Gets leads from specific date
// GET - http://127.0.0.1:4000/api/leads/range/:startDate/:endDate | Gets leads from specific date range
// GET - http://127.0.0.1:4000/api/leads/search | Gets leads with specific search criteria
// GET - http://127.0.0.1:4000/api/leads/status/:status | Gets leads with specific status
// GET - http://127.0.0.1:4000/api/leads/stats | Gets lead statistics
// POST - http://127.0.0.1:4000/api/leads | Adds a new lead to the firebase firestore
// POST - http://127.0.0.1:4000/api/leads/export/pdf/all | Exports all lead information as PDF 
// POST - http://127.0.0.1:4000/api/leads/export/pdf | Exports selected lead information as PDF using UUIDs
// PUT - http://127.0.0.1:4000/api/leads/:id | Updates specific lead information by UUID
// PUT - http://127.0.0.1:4000/api/leads/:id/tag | Adds / Updates specific tags on lead by UUID
// PUT - http://127.0.0.1:4000/api/leads/:id/status | Updates status on lead by UUID
// PUT - http://127.0.0.1:4000/api/leads/bulk/status | Updates status on lead by UUIDs
// DELETE - http://127.0.0.1:4000/api/leads/:id | Deletes specific lead by UUID (permanent delete)
router.get('/', getLeads)
router.get('/date/:date', getLeadsByDate)
router.get('/range/:startDate/:endDate', getLeadsByDateRange)
// router.get('/search', searchLeads)
router.get('/status/:status', getLeadsByStatus)
router.get('/filters', getLeadsByFilters)
// router.get('/stats', getLeadStats)
router.post('/', createLead);
router.post('/multiple', createMultipleLeads);
// router.post('/export/pdf/all', createLeadPDFAll)
// router.post('/export/pdf', createLeadPDF)
router.put('/:id', updateLead);
router.put('/:id/tag', updateLeadTag);
router.put('/bulk/status', updateLeadStatusBulk)
router.put('/:id/status', updateLeadStatus);
router.delete('/:id', deleteLead);

router.get('/route/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Lead Routes are working.' });
})

export default router;