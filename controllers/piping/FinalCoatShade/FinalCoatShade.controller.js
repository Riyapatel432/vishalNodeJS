const mongoose = require("mongoose");
const FinalCoatShade = require("../../../models/piping/FinalCoatShade/FinalCoatShade.model"); // adjust path if needed
const { sendResponse } = require("../../../helper/response");

const FinalCoatShadeController = {
  // CREATE or UPDATE FinalCoatShade
  saveFinalCoatShade: async (req, res) => {
  try {
    let { _id, service, shadeRalNo } = req.body;

    let finalCoatShadeDoc;

    if (_id) {
      // Update only provided fields
      const updateData = {
        ...(service && { service }),
        ...(shadeRalNo && { shadeRalNo }),
      };

      finalCoatShadeDoc = await FinalCoatShade.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      finalCoatShadeDoc = new FinalCoatShade({
        service,
        shadeRalNo,
      });
      await finalCoatShadeDoc.save();
    }

    res.status(200).json({
      success: true,
      message: _id
        ? "FinalCoatShade updated successfully"
        : "FinalCoatShade created successfully",
      data: finalCoatShadeDoc,
    });
  } catch (err) {
    console.error("❌ saveFinalCoatShade error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
},

  // GET All FinalCoatShades
  getAllFinalCoatShade: async (req, res) => {
    try {
      const { search, page = 1, limit = 10 } = { ...req.body, ...req.query };
      const pageNumber = Math.max(1, Number(page));
      const limitNumber = Math.max(1, Number(limit));

      const query = { deletedAt: null };

      if (search?.trim()) {
        const terms = search.trim().split(/\s+/);
        query.$or = terms.flatMap(term => {
          const regex = new RegExp(term, "i");
          return [
            { service: regex },
            { shadeRalNo: regex },
            { blasting_painting_requirements: regex },
            { paint_system_no: regex },
          ];
        });
      }

      const total = await FinalCoatShade.countDocuments(query);

      const FinalCoatShadeList = await FinalCoatShade.find(query, { __v: 0, deletedAt: 0 })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();

      sendResponse(res, 200, true, {
          data: FinalCoatShadeList,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
        },
        "FinalCoatShade list fetched successfully"
      );
    } catch (error) {
      console.error("❌ getAllFinalCoatShade error:", error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  },

  // GET FinalCoatShade by ID
  getFinalCoatShadeById: async (req, res) => {
    try {
      const finalCoatShadeDoc = await FinalCoatShade.findById(req.params.id);

      if (!finalCoatShadeDoc) {
        return res.status(404).json({ success: false, message: "FinalCoatShade not found" });
      }

      res.status(200).json({ success: true, data: finalCoatShadeDoc });
    } catch (err) {
      console.error("❌ getFinalCoatShadeById error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE FinalCoatShade (soft delete)
  deleteFinalCoatShade: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
      }

      const finalCoatShadeDoc = await FinalCoatShade.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
      );

      if (!finalCoatShadeDoc) {
        return res.status(404).json({ success: false, message: 'FinalCoatShade not found' });
      }

      res.status(200).json({ success: true, message: 'FinalCoatShade deleted successfully' });
    } catch (err) {
      console.error("❌ deleteFinalCoatShade error:", err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

};

module.exports = FinalCoatShadeController;
