const mongoose = require("mongoose");
const PaintRequirement = require("../../../models/piping/PaintingRequirement/paintrequirement.model"); // adjust path if needed
const { sendResponse } = require("../../../helper/response");

const PaintRequirementController = {
  // CREATE or UPDATE PaintRequirement
  savePaintRequirement: async (req, res) => {
    try {
      let {
        _id,
        paint_class,
        piping_material_specifiation,
        blasting_painting_requirements,
        paint_system_no,
      } = req.body;

      let paintRequirement;

      if (_id) {
        // Update only provided fields
        const updateData = {
          ...(paint_class && { paint_class }),
          ...(piping_material_specifiation && { piping_material_specifiation }),
          ...(blasting_painting_requirements && { blasting_painting_requirements }),
          ...(paint_system_no && { paint_system_no }),
        };

        paintRequirement = await PaintRequirement.findByIdAndUpdate(
          _id,
          updateData,
          { new: true, runValidators: true }
        );
      } else {
        // Create new
        paintRequirement = new PaintRequirement({
          paint_class,
          piping_material_specifiation,
          blasting_painting_requirements,
          paint_system_no,
        });
        await paintRequirement.save();
      }

      res.status(200).json({
        success: true,
        message: _id ? "PaintRequirement updated successfully" : "PaintRequirement created successfully",
        data: paintRequirement,
      });
    } catch (err) {
      console.error("❌ savePaintRequirement error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET All PaintRequirements
  getAllPaintRequirement: async (req, res) => {
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
            { paint_class: regex },
            { piping_material_specifiation: regex },
            { blasting_painting_requirements: regex },
            { paint_system_no: regex },
          ];
        });
      }

      const total = await PaintRequirement.countDocuments(query);

      const paintRequirementList = await PaintRequirement.find(query, { __v: 0, deletedAt: 0 })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();

      sendResponse(res, 200, true, {
          data: paintRequirementList,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
        },
        "PaintRequirement list fetched successfully"
      );
    } catch (error) {
      console.error("❌ getAllPaintRequirement error:", error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  },

  // GET PaintRequirement by ID
  getPaintRequirementById: async (req, res) => {
    try {
      const paintRequirement = await PaintRequirement.findById(req.params.id);

      if (!paintRequirement) {
        return res.status(404).json({ success: false, message: "PaintRequirement not found" });
      }

      res.status(200).json({ success: true, data: paintRequirement });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE PaintRequirement (soft delete)
  deletePaintRequirement: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
      }

      const paintRequirement = await PaintRequirement.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
      );

      if (!paintRequirement) {
        return res.status(404).json({ success: false, message: 'PaintRequirement not found' });
      }

      res.status(200).json({ success: true, message: 'PaintRequirement deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },
};

module.exports = PaintRequirementController;
