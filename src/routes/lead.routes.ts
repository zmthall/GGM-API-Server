// /routes/lead.routes.ts
import { Router } from "express";
import {
  getLeads,
  getLeadsByDate,
  getLeadsByDateRange,
  searchLeads,
  getLeadsByStatus,
  getLeadsByFilters,
  getLeadStats,
  getLeadById,
  createLead,
  createMultipleLeads,
  createLeadPDFAll,
  createLeadPDFById,
  createLeadPDFByDateRange,
  createLeadPDFByDate,
  updateLead,
  updateLeadTag,
  updateLeadStatus,
  updateLeadStatusBulk,
  deleteLead,
} from "../controllers/lead.controller";

// Middleware
import { verifyFirebaseToken } from "../middlewares/verifyFirebaseToken";

const router = Router();

// Administrative API Calls, requires firebaseToken for authentication
// GET - http://127.0.0.1:4000/api/leads | Gets all leads from the firebase firestore
// GET - http://127.0.0.1:4000/api/leads/:id | Gets lead by ID from firebase firestore
// GET - http://127.0.0.1:4000/api/leads/:date | Gets leads from specific date
// GET - http://127.0.0.1:4000/api/leads/range/:startDate/:endDate | Gets leads from specific date range
// GET - http://127.0.0.1:4000/api/leads/search | Gets leads with specific search criteria
// GET - http://127.0.0.1:4000/api/leads/status/:status | Gets leads with specific status
// GET - http://127.0.0.1:4000/api/leads/filters | Gets leads with specific filters
// GET - http://127.0.0.1:4000/api/leads/stats | Gets lead statistics
// POST - http://127.0.0.1:4000/api/leads | Adds a new lead to the firebase firestore
// POST - http://127.0.0.1:4000/api/leads/multiple | Adds multiple new leads to the firebase firestore
// POST - http://127.0.0.1:4000/api/leads/export/pdf/all | Exports all lead information as PDF
// POST - http://127.0.0.1:4000/api/leads/export/pdf/date-range | Exports lead information as PDF for leads in a date range
// POST - http://127.0.0.1:4000/api/leads/export/pdf/:date | Exports lead information as PDF for leads on a date
// POST - http://127.0.0.1:4000/api/leads/:id/export/pdf | Exports selected lead information as PDF using UUIDs
// PUT - http://127.0.0.1:4000/api/leads/:id | Updates specific lead information by UUID
// PUT - http://127.0.0.1:4000/api/leads/:id/tag | Adds / Updates specific tags on lead by UUID
// PUT - http://127.0.0.1:4000/api/leads/:id/status | Updates status on lead by UUID
// PUT - http://127.0.0.1:4000/api/leads/bulk/status | Updates status on lead by UUIDs
// DELETE - http://127.0.0.1:4000/api/leads/:id | Deletes specific lead by UUID (permanent delete)
router.get("/", verifyFirebaseToken, getLeads);
router.get("/date/:date", verifyFirebaseToken, getLeadsByDate);
router.get(
  "/range/:startDate/:endDate",
  verifyFirebaseToken,
  getLeadsByDateRange
);
router.get("/search", verifyFirebaseToken, searchLeads);
router.get("/status/:status", verifyFirebaseToken, getLeadsByStatus);
router.get("/filters", verifyFirebaseToken, getLeadsByFilters);
router.get("/stats", verifyFirebaseToken, getLeadStats);
router.get("/:id", verifyFirebaseToken, getLeadById);
router.post("/", verifyFirebaseToken, createLead);
router.post("/multiple", verifyFirebaseToken, createMultipleLeads);
router.post("/export/pdf/all", createLeadPDFAll);
router.post(
  "/export/pdf/date-range",
  verifyFirebaseToken,
  createLeadPDFByDateRange
);
router.post("/export/pdf/:date", verifyFirebaseToken, createLeadPDFByDate);
router.post("/:id/export/pdf", createLeadPDFById);
router.put("/:id", verifyFirebaseToken, updateLead);
router.put("/:id/tag", verifyFirebaseToken, updateLeadTag);
router.put("/bulk/status", verifyFirebaseToken, updateLeadStatusBulk);
router.put("/:id/status", verifyFirebaseToken, updateLeadStatus);
router.delete("/:id", verifyFirebaseToken, deleteLead);

router.get("/route/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "Lead Routes are working." });
});

export default router;
