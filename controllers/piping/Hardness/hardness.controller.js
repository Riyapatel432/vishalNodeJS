const mongoose = require("mongoose");
const Hardness = require("../../../models/piping/Hardness/hardness.model"); 
const { sendResponse } = require("../../../helper/response");

const HardnessController = {
  // CREATE or UPDATE Hardness
  saveHardness: async (req, res) => {
    try {
      const { _id, pipingClass, PipingMaterialSpecification, MaxAcceptableHardness, HardnessValue } = req.body;

      let hardnessDoc;

      if (_id) {
        const updateData = {
          ...(pipingClass && { pipingClass }),
          ...(PipingMaterialSpecification && { PipingMaterialSpecification }),
          ...(MaxAcceptableHardness && { MaxAcceptableHardness }),
          ...(HardnessValue && { HardnessValue }),
        };

        hardnessDoc = await Hardness.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
      } else {
        hardnessDoc = new Hardness({ pipingClass, PipingMaterialSpecification, MaxAcceptableHardness, HardnessValue });
        await hardnessDoc.save();
      }

      res.status(200).json({
        success: true,
        message: _id ? "Hardness updated successfully" : "Hardness created successfully",
        data: hardnessDoc,
      });
    } catch (err) {
      console.error("❌ saveHardness error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET All Hardness
  getAllHardness: async (req, res) => {
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
            { pipingClass: regex },
            { PipingMaterialSpecification: regex },
            { HardnessValue: regex },
          ];
        });
      }

      const total = await Hardness.countDocuments(query);

      const hardnessList = await Hardness.find(query, { __v: 0, deletedAt: 0 })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();

      sendResponse(res, 200, true, {
          data: hardnessList,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
        },
        "Hardness list fetched successfully"
      );
    } catch (error) {
      console.error("❌ getAllHardness error:", error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  },

  // GET Hardness by ID
  getHardnessById: async (req, res) => {
    try {
      const hardnessDoc = await Hardness.findById(req.params.id);

      if (!hardnessDoc) {
        return res.status(404).json({ success: false, message: "Hardness not found" });
      }

      res.status(200).json({ success: true, data: hardnessDoc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE Hardness (soft delete)
  deleteHardness: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
      }

      const hardnessDoc = await Hardness.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
      );

      if (!hardnessDoc) {
        return res.status(404).json({ success: false, message: 'Hardness not found' });
      }

      res.status(200).json({ success: true, message: 'Hardness deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },
};

module.exports = HardnessController;
