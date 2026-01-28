import TreatmentPage from "./treatmentPage.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/**
 * TREATMENT PAGE CMS CONTROLLER
 *
 * Handles CRUD operations for treatment page content management.
 *
 * ═══════════════════════════════════════════════════════════════
 * POSTMAN TESTING GUIDE
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. CREATE TREATMENT PAGE
 * ------------------------
 * Method: POST
 * URL: http://localhost:5000/api/cms/treatments
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 * Body (JSON):
 * {
 *   "title": "Root Canal Treatment",
 *   "slug": "root-canal-treatment-rct",
 *   "shortDescription": "Save your natural tooth with painless RCT",
 *   "meta": {
 *     "title": "Root Canal Treatment (RCT) in Hapur | Ujjwal Dental",
 *     "description": "Expert root canal treatment with modern techniques",
 *     "keywords": ["root canal", "RCT", "tooth pain"]
 *   },
 *   "hero": {
 *     "heading": "Root Canal Treatment",
 *     "subheading": "Painless procedure to save your natural tooth",
 *     "image": "https://res.cloudinary.com/xxx/hero-rct.jpg",
 *     "ctaText": "Book Appointment"
 *   },
 *   "overview": {
 *     "title": "What is Root Canal Treatment?",
 *     "content": "<p>Root canal treatment is a dental procedure...</p>"
 *   }
 * }
 *
 *
 * 2. GET ALL TREATMENT PAGES (Public - published only)
 * ----------------------------------------------------
 * Method: GET
 * URL: http://localhost:5000/api/cms/treatments
 *
 *
 * 3. GET ALL TREATMENT PAGES (Admin - all pages)
 * ----------------------------------------------
 * Method: GET
 * URL: http://localhost:5000/api/cms/treatments/all
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 4. GET TREATMENT PAGE BY SLUG (Public)
 * --------------------------------------
 * Method: GET
 * URL: http://localhost:5000/api/cms/treatments/root-canal-treatment-rct
 *
 *
 * 5. GET TREATMENT PAGE BY ID (Admin)
 * -----------------------------------
 * Method: GET
 * URL: http://localhost:5000/api/cms/treatments/id/:id
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 6. UPDATE TREATMENT PAGE
 * ------------------------
 * Method: PATCH
 * URL: http://localhost:5000/api/cms/treatments/:id
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 * Body (JSON):
 * {
 *   "title": "Updated Title",
 *   "shortDescription": "Updated description",
 *   "pricing": {
 *     "startingPrice": 3000,
 *     "maxPrice": 15000,
 *     "factors": ["Tooth location", "Complexity"]
 *   }
 * }
 *
 *
 * 7. DELETE TREATMENT PAGE
 * ------------------------
 * Method: DELETE
 * URL: http://localhost:5000/api/cms/treatments/:id
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 8. PUBLISH TREATMENT PAGE
 * -------------------------
 * Method: PATCH
 * URL: http://localhost:5000/api/cms/treatments/:id/publish
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 9. UNPUBLISH TREATMENT PAGE
 * ---------------------------
 * Method: PATCH
 * URL: http://localhost:5000/api/cms/treatments/:id/unpublish
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 10. ADD SECTION
 * ---------------
 * Method: POST
 * URL: http://localhost:5000/api/cms/treatments/:id/sections
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 *
 * Body for TEXT section:
 * {
 *   "title": "Benefits of RCT",
 *   "type": "text",
 *   "content": "<p>Root canal treatment saves your natural tooth...</p>"
 * }
 *
 * Body for LIST section:
 * {
 *   "title": "Symptoms",
 *   "type": "list",
 *   "items": ["Severe toothache", "Sensitivity to hot/cold", "Darkening of tooth"]
 * }
 *
 * Body for STEPS section:
 * {
 *   "title": "Procedure Steps",
 *   "type": "steps",
 *   "steps": [
 *     { "stepNumber": 1, "title": "X-Ray", "description": "We take an X-ray...", "duration": "10 min" },
 *     { "stepNumber": 2, "title": "Anesthesia", "description": "Local anesthesia...", "duration": "5 min" }
 *   ]
 * }
 *
 * Body for TABLE section:
 * {
 *   "title": "Treatment Comparison",
 *   "type": "table",
 *   "tableData": {
 *     "headers": ["Feature", "RCT", "Extraction"],
 *     "rows": [
 *       ["Preserves tooth", "Yes", "No"],
 *       ["Cost", "Higher", "Lower"]
 *     ]
 *   }
 * }
 *
 * Body for IMAGE section:
 * {
 *   "title": "Before and After",
 *   "type": "image",
 *   "image": {
 *     "url": "https://res.cloudinary.com/xxx/before-after.jpg",
 *     "alt": "RCT before and after",
 *     "caption": "Results after treatment"
 *   }
 * }
 *
 * Body for VIDEO section:
 * {
 *   "title": "Watch the Procedure",
 *   "type": "video",
 *   "video": {
 *     "url": "https://www.youtube.com/watch?v=xxxxx",
 *     "title": "RCT Procedure Explained"
 *   }
 * }
 *
 *
 * 11. UPDATE SECTION
 * ------------------
 * Method: PATCH
 * URL: http://localhost:5000/api/cms/treatments/:id/sections/:sectionId
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 * Body (JSON):
 * {
 *   "title": "Updated Section Title",
 *   "content": "Updated content..."
 * }
 *
 *
 * 12. DELETE SECTION
 * ------------------
 * Method: DELETE
 * URL: http://localhost:5000/api/cms/treatments/:id/sections/:sectionId
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 13. REORDER SECTIONS
 * --------------------
 * Method: PATCH
 * URL: http://localhost:5000/api/cms/treatments/:id/sections/reorder
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 * Body (JSON):
 * {
 *   "orderedIds": ["section_id_1", "section_id_3", "section_id_2"]
 * }
 *
 *
 * 14. ADD FAQ
 * -----------
 * Method: POST
 * URL: http://localhost:5000/api/cms/treatments/:id/faqs
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 * Body (JSON):
 * {
 *   "question": "Is root canal painful?",
 *   "answer": "With modern anesthesia, RCT is virtually painless..."
 * }
 *
 *
 * 15. UPDATE FAQ
 * --------------
 * Method: PATCH
 * URL: http://localhost:5000/api/cms/treatments/:id/faqs/:faqId
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *   - Content-Type: application/json
 * Body (JSON):
 * {
 *   "question": "Updated question?",
 *   "answer": "Updated answer..."
 * }
 *
 *
 * 16. DELETE FAQ
 * --------------
 * Method: DELETE
 * URL: http://localhost:5000/api/cms/treatments/:id/faqs/:faqId
 * Headers:
 *   - Authorization: Bearer <admin_token>
 *
 *
 * 17. INCREMENT VIEW COUNT (Public)
 * ---------------------------------
 * Method: POST
 * URL: http://localhost:5000/api/cms/treatments/:id/view
 *
 *
 * 18. SEARCH TREATMENT PAGES (Public)
 * -----------------------------------
 * Method: GET
 * URL: http://localhost:5000/api/cms/treatments/search?q=root+canal
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ============ PUBLIC ENDPOINTS ============

/**
 * Get all published treatment pages (public listing)
 * GET /api/cms/treatments
 */
export const getPublishedPages = async (req, res) => {
  try {
    const pages = await TreatmentPage.getPublishedPages();

    return ApiResponse.success(res, { treatmentPages: pages });
  } catch (error) {
    console.error("Get published pages error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Get treatment page by slug (public)
 * GET /api/cms/treatments/:slug
 */
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await TreatmentPage.getBySlug(slug);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    return ApiResponse.success(res, { treatmentPage: page });
  } catch (error) {
    console.error("Get page by slug error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Search treatment pages (public)
 * GET /api/cms/treatments/search?q=query
 */
export const searchPages = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return ApiResponse.error(res, "Search query is required", 400);
    }

    const pages = await TreatmentPage.search(q);

    return ApiResponse.success(res, { treatmentPages: pages });
  } catch (error) {
    console.error("Search pages error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Increment view count (public)
 * POST /api/cms/treatments/:id/view
 */
export const incrementViewCount = async (req, res) => {
  try {
    const page = await TreatmentPage.findById(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.incrementViews();

    return ApiResponse.success(res, { viewCount: page.viewCount });
  } catch (error) {
    console.error("Increment view count error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

// ============ ADMIN ENDPOINTS ============

/**
 * Get all treatment pages (admin - includes unpublished)
 * GET /api/cms/treatments/all
 */
export const getAllPages = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isPublished } = req.query;

    const query = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished === "true";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [pages, total] = await Promise.all([
      TreatmentPage.find(query)
        .select(
          "title slug shortDescription isPublished publishedAt viewCount createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TreatmentPage.countDocuments(query),
    ]);

    return ApiResponse.success(res, {
      treatmentPages: pages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Get all pages error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Get treatment page by ID (admin)
 * GET /api/cms/treatments/id/:id
 */
export const getPageById = async (req, res) => {
  try {
    const page = await TreatmentPage.findById(req.params.id)
      .populate("relatedTreatments", "title slug")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    return ApiResponse.success(res, { treatmentPage: page });
  } catch (error) {
    console.error("Get page by ID error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Create treatment page (admin)
 * POST /api/cms/treatments
 */
export const createPage = async (req, res) => {
  try {
    const pageData = {
      ...req.body,
      createdBy: req.user?._id,
    };

    const page = await TreatmentPage.create(pageData);

    return ApiResponse.success(
      res,
      { treatmentPage: page },
      "Treatment page created successfully",
      201
    );
  } catch (error) {
    console.error("Create page error:", error);

    if (error.code === 11000) {
      return ApiResponse.error(
        res,
        "A treatment page with this slug already exists",
        400
      );
    }

    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Update treatment page (admin)
 * PATCH /api/cms/treatments/:id
 */
export const updatePage = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?._id,
    };

    // Don't allow updating these fields directly
    delete updateData.sections;
    delete updateData.faqs;
    delete updateData.tableOfContents;
    delete updateData.viewCount;

    const page = await TreatmentPage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    return ApiResponse.success(
      res,
      { treatmentPage: page },
      "Treatment page updated successfully"
    );
  } catch (error) {
    console.error("Update page error:", error);

    if (error.code === 11000) {
      return ApiResponse.error(
        res,
        "A treatment page with this slug already exists",
        400
      );
    }

    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Delete treatment page (admin)
 * DELETE /api/cms/treatments/:id
 */
export const deletePage = async (req, res) => {
  try {
    const page = await TreatmentPage.findByIdAndDelete(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    return ApiResponse.success(res, null, "Treatment page deleted successfully");
  } catch (error) {
    console.error("Delete page error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Publish treatment page (admin)
 * PATCH /api/cms/treatments/:id/publish
 */
export const publishPage = async (req, res) => {
  try {
    const page = await TreatmentPage.findById(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.publish();

    return ApiResponse.success(
      res,
      { treatmentPage: page },
      "Treatment page published successfully"
    );
  } catch (error) {
    console.error("Publish page error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Unpublish treatment page (admin)
 * PATCH /api/cms/treatments/:id/unpublish
 */
export const unpublishPage = async (req, res) => {
  try {
    const page = await TreatmentPage.findById(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.unpublish();

    return ApiResponse.success(
      res,
      { treatmentPage: page },
      "Treatment page unpublished successfully"
    );
  } catch (error) {
    console.error("Unpublish page error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

// ============ SECTION MANAGEMENT ============

/**
 * Add section to treatment page
 * POST /api/cms/treatments/:id/sections
 */
export const addSection = async (req, res) => {
  try {
    const page = await TreatmentPage.findById(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.addSection(req.body);

    return ApiResponse.success(
      res,
      { sections: page.sections, tableOfContents: page.tableOfContents },
      "Section added successfully"
    );
  } catch (error) {
    console.error("Add section error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Update section
 * PATCH /api/cms/treatments/:id/sections/:sectionId
 */
export const updateSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    const page = await TreatmentPage.findById(id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.updateSection(sectionId, req.body);

    return ApiResponse.success(
      res,
      { sections: page.sections, tableOfContents: page.tableOfContents },
      "Section updated successfully"
    );
  } catch (error) {
    console.error("Update section error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Delete section
 * DELETE /api/cms/treatments/:id/sections/:sectionId
 */
export const deleteSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    const page = await TreatmentPage.findById(id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.removeSection(sectionId);

    return ApiResponse.success(
      res,
      { sections: page.sections, tableOfContents: page.tableOfContents },
      "Section deleted successfully"
    );
  } catch (error) {
    console.error("Delete section error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Reorder sections
 * PATCH /api/cms/treatments/:id/sections/reorder
 */
export const reorderSections = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return ApiResponse.error(res, "orderedIds array is required", 400);
    }

    const page = await TreatmentPage.findById(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.reorderSections(orderedIds);

    return ApiResponse.success(
      res,
      { sections: page.sections, tableOfContents: page.tableOfContents },
      "Sections reordered successfully"
    );
  } catch (error) {
    console.error("Reorder sections error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

// ============ FAQ MANAGEMENT ============

/**
 * Add FAQ to treatment page
 * POST /api/cms/treatments/:id/faqs
 */
export const addFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return ApiResponse.error(res, "Question and answer are required", 400);
    }

    const page = await TreatmentPage.findById(req.params.id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.addFaq(question, answer);

    return ApiResponse.success(
      res,
      { faqs: page.faqs },
      "FAQ added successfully"
    );
  } catch (error) {
    console.error("Add FAQ error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Update FAQ
 * PATCH /api/cms/treatments/:id/faqs/:faqId
 */
export const updateFaq = async (req, res) => {
  try {
    const { id, faqId } = req.params;

    const page = await TreatmentPage.findById(id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.updateFaq(faqId, req.body);

    return ApiResponse.success(
      res,
      { faqs: page.faqs },
      "FAQ updated successfully"
    );
  } catch (error) {
    console.error("Update FAQ error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

/**
 * Delete FAQ
 * DELETE /api/cms/treatments/:id/faqs/:faqId
 */
export const deleteFaq = async (req, res) => {
  try {
    const { id, faqId } = req.params;

    const page = await TreatmentPage.findById(id);

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    await page.removeFaq(faqId);

    return ApiResponse.success(
      res,
      { faqs: page.faqs },
      "FAQ deleted successfully"
    );
  } catch (error) {
    console.error("Delete FAQ error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};

// ============ PROCEDURE STEPS ============

/**
 * Update procedure steps
 * PATCH /api/cms/treatments/:id/procedure-steps
 */
export const updateProcedureSteps = async (req, res) => {
  try {
    const { procedureSteps } = req.body;

    if (!procedureSteps || !Array.isArray(procedureSteps)) {
      return ApiResponse.error(res, "procedureSteps array is required", 400);
    }

    const page = await TreatmentPage.findByIdAndUpdate(
      req.params.id,
      { procedureSteps },
      { new: true, runValidators: true }
    );

    if (!page) {
      return ApiResponse.error(res, "Treatment page not found", 404);
    }

    return ApiResponse.success(
      res,
      { procedureSteps: page.procedureSteps },
      "Procedure steps updated successfully"
    );
  } catch (error) {
    console.error("Update procedure steps error:", error);
    return ApiResponse.error(res, error.message, 500);
  }
};
