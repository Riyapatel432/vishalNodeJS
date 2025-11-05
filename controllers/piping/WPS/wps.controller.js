const WPS = require("../../../models/piping/WPS/wps.model"); // adjust path if needed
const { sendResponse } = require("../../../helper/response");

// Create or Update WPS
const saveWPS = async (req, res) => {
  try {
    let {
      id, // optional: if provided, we update
      project,
      jointType,
      wpsNo,
      PipingMaterialSpecification,
      weldingProcess,
      MinimumThickness,
      MaximumThickness,
      PreHeat,
      PWHT,
      pdf
    } = req.body;

    // Parse jointType if string
    const jointData = typeof jointType === "string" ? JSON.parse(jointType) : jointType;

    // Ensure thickness fields are numbers
    MinimumThickness = Number(MinimumThickness);
    MaximumThickness = Number(MaximumThickness);

    const wpsData = {
      project,
      jointType: jointData,
      wpsNo,
      PipingMaterialSpecification,
      weldingProcess,
      MinimumThickness,
      MaximumThickness,
      PreHeat,
      PWHT,
      pdf
    };

    
    let wps;

    if (id) {
      wps = await WPS.findOneAndUpdate(
        { _id: id, deletedAt: null },
        wpsData,
        { new: true, runValidators: true }
      );

      if (!wps) return sendResponse(res, 404, false, "WPS not found or deleted");
    } else {
      wps = new WPS(wpsData);
      await wps.save();
    }

    sendResponse(res, 200, true , wps, "WPS saved successfully");
  } catch (error) {
    console.error("❌ saveWPS error:", error);
    sendResponse(res, 500, false, "Server Error", null, error.message);
  }
};

// GET all active WPS documents
const getAllWPS = async (req, res) => {
  try {
    const { project, search, page = 1, limit = 10 } = { ...req.body, ...req.query };
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));

    const query = { deletedAt: null };

    if (project) query.project = project;

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i"); // case-insensitive, partial match
      query.$or = [
        { wpsNo: regex },
        { PipingMaterialSpecification: regex },
        { weldingProcess: regex },
        // If project is populated, you can't query by "project.name" here directly.
        // Instead, you’ll need an aggregation or filter after populate.
      ];
    }

    // Fetch with populate
    const total = await WPS.countDocuments(query);

    let wpsList = await WPS.find(query, { __v: 0, deletedAt: 0 })
      .populate("project", "name")
      .populate("jointType.jointId", "name")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    sendResponse(res, 200, true, {
      data: wpsList,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
    }, "WPS list fetched successfully");

  } catch (error) {
    console.error("❌ getAllWPS error:", error);
    sendResponse(res, 500, false, "Server Error", null, error.message);
  }
};


// GET a single WPS by ID
const getWPSById = async (req, res) => {
  try {
    const { id } = req.params;
    const wps = await WPS.findOne({ _id: id, deletedAt: null }).populate("project");

    if (!wps) return sendResponse(res, 404, false, "WPS not found or deleted");

    sendResponse(res, 200, true, "WPS fetched successfully", wps);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Server Error", null, error.message);
  }
};

// Soft DELETE WPS
const deleteWPS = async (req, res) => {
  try {
    const { id } = req.params;
    const wps = await WPS.findOne({ _id: id, deletedAt: null });

    if (!wps) return sendResponse(res, 404, false, "WPS not found or already deleted");

    wps.deletedAt = new Date();
    await wps.save();

    sendResponse(res, 200, true, "WPS soft deleted successfully");
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Server Error", null, error.message);
  }
};

module.exports = { saveWPS, getAllWPS, getWPSById, deleteWPS };
