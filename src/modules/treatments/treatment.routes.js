import { Router } from 'express';
import * as treatmentController from './treatment.controller.js';

const router = Router();

/**
 * TREATMENT ROUTES
 * Base path: /api/treatments
 *
 * Two types of data:
 * 1. Treatment Master - Catalog of available treatments (15 treatments)
 * 2. Treatment Instance - Actual treatment given to a patient
 */

// ========== TREATMENT MASTER (Catalog) ==========

// Get all treatment types (catalog)
router.get('/master', treatmentController.getAllTreatmentTypes);

// Get single treatment type // for now no needed
router.get('/master/:id', treatmentController.getTreatmentTypeById);

// Create new treatment type (Admin)
router.post('/master', treatmentController.createTreatmentType);

// Update treatment type (Admin)
router.patch('/master/:id', treatmentController.updateTreatmentType);

// Delete (deactivate) treatment type (Admin)
router.delete('/master/:id', treatmentController.deleteTreatmentType);

// ========== TREATMENT INSTANCES (Patient Treatments) ==========

// Get all treatment instances
router.get('/', treatmentController.getAllTreatments);

// Get single treatment instance
router.get('/:id', treatmentController.getTreatmentById);

// Add treatment to appointment
router.post('/', treatmentController.createTreatment);

// Update treatment instance
router.patch('/:id', treatmentController.updateTreatment);

// Update treatment status
router.patch('/:id/status', treatmentController.updateTreatmentStatus);

// Add session to treatment (for multi-session treatments)
router.post('/:id/sessions', treatmentController.addSession);

// Schedule follow-up for treatment
router.post('/:id/follow-up', treatmentController.scheduleFollowUp);

export default router;
