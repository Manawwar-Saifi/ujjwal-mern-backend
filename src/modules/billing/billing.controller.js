import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Invoice from "./invoice.model.js";
import Patient from "../patients/patient.model.js";
import mongoose from "mongoose";

/**
 * BILLING CONTROLLER
 *
 * Handles:
 * - Invoice CRUD operations
 * - Invoice issuing and cancellation
 * - Payment tracking
 */

/**
 * @desc    Get all invoices
 * @route   GET /api/billing/invoices?patient=&status=&from=&to=
 * @access  Admin
 */
export const getAllInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, patient, status, paymentStatus, clinic, from, to } = req.query;

  // Build query
  const query = {};

  if (patient && mongoose.Types.ObjectId.isValid(patient)) {
    query.patient = patient;
  }

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (clinic && mongoose.Types.ObjectId.isValid(clinic)) {
    query.clinic = clinic;
  }

  // Date range filter
  if (from || to) {
    query.invoiceDate = {};
    if (from) {
      query.invoiceDate.$gte = new Date(from);
    }
    if (to) {
      query.invoiceDate.$lte = new Date(to);
    }
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate("patient", "name phone email")
      .populate("clinic", "name code")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Invoice.countDocuments(query),
  ]);

  ApiResponse.paginated(res, invoices, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * @desc    Get invoice by ID
 * @route   GET /api/billing/invoices/:id
 * @access  Admin
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id)
    .populate("patient", "name phone email address membership")
    .populate("clinic", "name code address phone")
    .populate("appointment")
    .populate("createdBy", "name")
    .populate("cancelledBy", "name");

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  ApiResponse.success(res, { invoice }, "Invoice fetched successfully");
});

/**
 * @desc    Get invoice by invoice number
 * @route   GET /api/billing/invoices/number/:invoiceNumber
 * @access  Admin
 */
export const getInvoiceByNumber = asyncHandler(async (req, res) => {
  const { invoiceNumber } = req.params;

  const invoice = await Invoice.findOne({ invoiceNumber })
    .populate("patient", "name phone email address")
    .populate("clinic", "name code address phone")
    .populate("appointment");

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  ApiResponse.success(res, { invoice }, "Invoice fetched successfully");
});

/**
 * @desc    Create new invoice
 * @route   POST /api/billing/invoices
 * @access  Admin
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const { patient, clinic, appointment, items, discount, notes, terms } = req.body;

  // Validation
  if (!patient || !clinic || !items || items.length === 0) {
    return ApiResponse.error(res, "Patient, clinic and at least one item are required", 400);
  }

  // Verify patient exists
  const patientDoc = await Patient.findById(patient);
  if (!patientDoc) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Process items and apply membership discount if applicable
  const processedItems = items.map((item) => {
    const quantity = item.quantity || 1;
    const unitPrice = Number(item.unitPrice);
    let itemDiscount = { percentage: 0, amount: 0 };

    // Apply membership discount if patient has active membership
    if (patientDoc.hasMembership && !item.discount?.percentage) {
      itemDiscount.percentage = patientDoc.currentDiscount;
    } else if (item.discount) {
      itemDiscount = item.discount;
    }

    // Calculate amount after discount
    let amount = unitPrice * quantity;
    if (itemDiscount.percentage > 0) {
      amount = amount - (amount * itemDiscount.percentage) / 100;
    }
    if (itemDiscount.amount > 0) {
      amount = amount - itemDiscount.amount;
    }
    amount = Math.max(0, amount);

    // Calculate tax
    const taxRate = item.taxRate || 0;
    const taxAmount = (amount * taxRate) / 100;
    const total = amount + taxAmount;

    return {
      itemType: item.itemType || "other",
      itemRef: item.itemRef,
      itemRefModel: item.itemRefModel,
      description: item.description,
      quantity,
      unitPrice,
      discount: itemDiscount,
      taxRate,
      amount,
      taxAmount,
      total,
    };
  });

  // Create invoice
  const invoice = await Invoice.create({
    patient,
    clinic,
    appointment,
    items: processedItems,
    discount: discount || { percentage: 0, amount: 0 },
    notes,
    terms,
    createdBy: req.user?._id,
  });

  // Populate for response
  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate("patient", "name phone")
    .populate("clinic", "name code");

  ApiResponse.created(res, { invoice: populatedInvoice }, "Invoice created successfully");
});

/**
 * @desc    Update invoice (add/modify items)
 * @route   PATCH /api/billing/invoices/:id
 * @access  Admin
 */
export const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  // Can only update draft invoices
  if (invoice.status !== "draft") {
    return ApiResponse.error(res, "Only draft invoices can be modified", 400);
  }

  // Update allowed fields
  const allowedFields = ["items", "discount", "notes", "terms", "dueDate"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      invoice[field] = req.body[field];
    }
  });

  await invoice.save();

  const updatedInvoice = await Invoice.findById(id)
    .populate("patient", "name phone")
    .populate("clinic", "name code");

  ApiResponse.success(res, { invoice: updatedInvoice }, "Invoice updated successfully");
});

/**
 * @desc    Add item to invoice
 * @route   POST /api/billing/invoices/:id/items
 * @access  Admin
 */
export const addInvoiceItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const itemData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  // Can only add items to draft invoices
  if (invoice.status !== "draft") {
    return ApiResponse.error(res, "Can only add items to draft invoices", 400);
  }

  // Validate item data
  if (!itemData.description || itemData.unitPrice === undefined) {
    return ApiResponse.error(res, "Item description and unit price are required", 400);
  }

  // Process item
  const quantity = itemData.quantity || 1;
  const unitPrice = Number(itemData.unitPrice);
  const itemDiscount = itemData.discount || { percentage: 0, amount: 0 };

  let amount = unitPrice * quantity;
  if (itemDiscount.percentage > 0) {
    amount = amount - (amount * itemDiscount.percentage) / 100;
  }
  if (itemDiscount.amount > 0) {
    amount = amount - itemDiscount.amount;
  }
  amount = Math.max(0, amount);

  const taxRate = itemData.taxRate || 0;
  const taxAmount = (amount * taxRate) / 100;
  const total = amount + taxAmount;

  const newItem = {
    itemType: itemData.itemType || "other",
    itemRef: itemData.itemRef,
    itemRefModel: itemData.itemRefModel,
    description: itemData.description,
    quantity,
    unitPrice,
    discount: itemDiscount,
    taxRate,
    amount,
    taxAmount,
    total,
  };

  await invoice.addItem(newItem);

  const updatedInvoice = await Invoice.findById(id)
    .populate("patient", "name phone");

  ApiResponse.success(res, { invoice: updatedInvoice }, "Item added successfully");
});

/**
 * @desc    Remove item from invoice
 * @route   DELETE /api/billing/invoices/:id/items/:itemId
 * @access  Admin
 */
export const removeInvoiceItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  // Can only remove items from draft invoices
  if (invoice.status !== "draft") {
    return ApiResponse.error(res, "Can only remove items from draft invoices", 400);
  }

  await invoice.removeItem(itemId);

  const updatedInvoice = await Invoice.findById(id)
    .populate("patient", "name phone");

  ApiResponse.success(res, { invoice: updatedInvoice }, "Item removed successfully");
});

/**
 * @desc    Issue invoice (finalize)
 * @route   POST /api/billing/invoices/:id/issue
 * @access  Admin
 */
export const issueInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  // Can only issue draft invoices
  if (invoice.status !== "draft") {
    return ApiResponse.error(res, "Only draft invoices can be issued", 400);
  }

  // Check if invoice has items
  if (invoice.items.length === 0) {
    return ApiResponse.error(res, "Cannot issue invoice with no items", 400);
  }

  await invoice.markAsSent();

  ApiResponse.success(res, { invoice }, "Invoice issued successfully");
});

/**
 * @desc    Cancel invoice
 * @route   POST /api/billing/invoices/:id/cancel
 * @access  Admin
 */
export const cancelInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  // Cannot cancel paid invoices
  if (invoice.paymentStatus === "paid") {
    return ApiResponse.error(res, "Cannot cancel a fully paid invoice", 400);
  }

  // Cannot cancel already cancelled invoices
  if (invoice.status === "cancelled") {
    return ApiResponse.error(res, "Invoice is already cancelled", 400);
  }

  // If partially paid, warn
  if (invoice.amountPaid > 0) {
    return ApiResponse.error(
      res,
      "Invoice has payments recorded. Please process refunds first.",
      400
    );
  }

  await invoice.cancelInvoice(req.user?._id, reason || "Cancelled by admin");

  ApiResponse.success(res, { invoice }, "Invoice cancelled successfully");
});

/**
 * @desc    Record payment for invoice
 * @route   POST /api/billing/invoices/:id/payment
 * @access  Admin
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  if (!amount || amount <= 0) {
    return ApiResponse.error(res, "Valid payment amount is required", 400);
  }

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  if (invoice.status === "cancelled") {
    return ApiResponse.error(res, "Cannot record payment for cancelled invoice", 400);
  }

  if (invoice.paymentStatus === "paid") {
    return ApiResponse.error(res, "Invoice is already fully paid", 400);
  }

  // Check if payment exceeds balance
  if (amount > invoice.balanceDue) {
    return ApiResponse.error(
      res,
      `Payment amount (${amount}) exceeds balance due (${invoice.balanceDue})`,
      400
    );
  }

  await invoice.recordPayment(amount);

  const updatedInvoice = await Invoice.findById(id)
    .populate("patient", "name phone");

  ApiResponse.success(res, { invoice: updatedInvoice }, "Payment recorded successfully");
});

/**
 * @desc    Get pending invoices for a patient
 * @route   GET /api/billing/invoices/patient/:patientId/pending
 * @access  Admin
 */
export const getPatientPendingInvoices = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return ApiResponse.error(res, "Invalid patient ID", 400);
  }

  const invoices = await Invoice.getPendingInvoices(patientId);

  ApiResponse.success(res, { invoices }, "Pending invoices fetched successfully");
});

/**
 * @desc    Get overdue invoices
 * @route   GET /api/billing/invoices/overdue
 * @access  Admin
 */
export const getOverdueInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.getOverdueInvoices();

  ApiResponse.success(res, { invoices }, "Overdue invoices fetched successfully");
});

/**
 * @desc    Get billing summary/statistics
 * @route   GET /api/billing/stats
 * @access  Admin
 */
export const getBillingStats = asyncHandler(async (req, res) => {
  const { clinic, from, to } = req.query;

  // Date range (default: current month)
  const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = to ? new Date(to) : new Date();

  // Build match query
  const matchQuery = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: "cancelled" },
  };

  if (clinic && mongoose.Types.ObjectId.isValid(clinic)) {
    matchQuery.clinic = new mongoose.Types.ObjectId(clinic);
  }

  const stats = await Invoice.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: "$grandTotal" },
        totalPaid: { $sum: "$amountPaid" },
        totalDue: { $sum: "$balanceDue" },
        paidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
        },
        partialCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "partial"] }, 1, 0] },
        },
        unpaidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
  };

  ApiResponse.success(
    res,
    {
      stats: result,
      dateRange: { from: startDate, to: endDate },
    },
    "Billing statistics fetched successfully"
  );
});

/**
 * @desc    Download invoice as PDF
 * @route   GET /api/billing/invoices/:id/pdf
 * @access  Admin / Patient (own invoice)
 */
export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid invoice ID", 400);
  }

  const invoice = await Invoice.findById(id)
    .populate("patient", "name phone email address")
    .populate("clinic", "name code address phone");

  if (!invoice) {
    return ApiResponse.error(res, "Invoice not found", 404);
  }

  // TODO: Implement PDF generation using pdfkit or puppeteer
  // For now, return invoice data that can be used to generate PDF on frontend

  ApiResponse.success(
    res,
    {
      invoice,
      message: "PDF generation to be implemented. Use this data for client-side PDF generation.",
    },
    "Invoice data fetched for PDF"
  );
});
