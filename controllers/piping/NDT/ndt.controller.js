const mongoose = require("mongoose");
const Ndt = require("../../../models/piping/NDT/ndt.model"); // adjust path if needed
const { sendResponse } = require("../../../helper/response");

const NdtController = {
  // CREATE or UPDATE Ndt

  saveNdt: async (req, res) => {
    try {
      let {
        _id,
        piping_class,
        service,
        jointType,
        piping_material_specifiation,
        BSRRT,
        Ferrite,
        PWHT,
        ASRRT,
        RT,
        MPL,
        LPT,
        Hardness,
        PMI,
        PicklingPassivation,
      } = req.body;

      // Parse jointType if sent as string
      if (typeof jointType === "string") {
        try {
          jointType = JSON.parse(jointType);
        } catch (err) {
          return res.status(400).json({ success: false, message: "Invalid jointType format" });
        }
      }

      let ndtDoc; // renamed from Ndt

      if (_id) {
        // Update only provided fields
        const updateData = {
          ...(piping_class && { piping_class }),
          ...(service && { service }),
          ...(piping_material_specifiation && { piping_material_specifiation }),
          ...(jointType && { jointType }),
          ...(BSRRT !== undefined && { BSRRT }),
          ...(Ferrite !== undefined && { Ferrite }),
          ...(PWHT && { PWHT }),
          ...(ASRRT && { ASRRT }),
          ...(RT && { RT }),
          ...(MPL && { MPL }),
          ...(LPT && { LPT }),
          ...(Hardness && { Hardness }),
          ...(PMI && { PMI }),
          ...(PicklingPassivation && { PicklingPassivation }),
        };

        ndtDoc = await Ndt.findByIdAndUpdate(
          _id,
          updateData,
          { new: true, runValidators: true }
        );
      } else {
        // Create new
        ndtDoc = new Ndt({
          piping_class,
          service,
          jointType,
          piping_material_specifiation,
          BSRRT,
          Ferrite,
          PWHT,
          ASRRT,
          RT,
          MPL,
          LPT,
          Hardness,
          PMI,
          PicklingPassivation,
        });
        await ndtDoc.save();
      }

      res.status(200).json({
        success: true,
        message: _id ? "Ndt updated successfully" : "Ndt created successfully",
        data: ndtDoc
      });
    } catch (err) {
      console.error("❌ saveNdt error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET All Ndts
  getAllNdt: async (req, res) => {
    try {
      const { search, page = 1, limit = 10 } = { ...req.body, ...req.query };
      const pageNumber = Math.max(1, Number(page));
      const limitNumber = Math.max(1, Number(limit));

      const query = { deletedAt: null };

      if (search?.trim()) {
        // split by spaces (can also split by comma if needed)
        const terms = search.trim().split(/\s+/);

        // build OR for each field and term
        query.$or = terms.flatMap((term) => {
          const regex = new RegExp(term, "i");
          return [
            { piping_class: regex },
            { Hardness: regex },
            { PWHT: regex },
            // if wpsNo is populated and you want to search inside -> need aggregate
          ];
        });
      }

      // 👉 count total
      const total = await Ndt.countDocuments(query);

      // 👉 fetch with populate + pagination
      const NdtList = await Ndt.find(query, { __v: 0, deletedAt: 0 })
        .populate("piping_class", "")
        .populate("jointType.jointId", "name")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();

      sendResponse(
        res,
        200,
        true,
        {
          data: NdtList,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
        },
        "Ndt list fetched successfully"
      );
    } catch (error) {
      console.error("❌ getAllNdt error:", error);
      sendResponse(res, 500, false, "Server Error", null, error.message);
    }
  },


  getNdtById: async (req, res) => {
    try {
      const ndtDoc = await Ndt.findById(req.params.id)
        .populate("piping_class")
        .populate("jointType.jointId", "name");

      if (!ndtDoc) {
        return res.status(404).json({ success: false, message: "Ndt not found" });
      }

      res.status(200).json({ success: true, data: ndtDoc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },


  // DELETE Ndt (soft delete)
  deleteNdt: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
      }

      const ndtDoc = await Ndt.findByIdAndUpdate(
        id,                    // use id, not _id
        { deletedAt: new Date() },
        { new: true }
      );

      if (!ndtDoc) {
        return res.status(404).json({ success: false, message: 'Ndt not found' });
      }

      res.status(200).json({ success: true, message: 'Ndt deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

};

module.exports = NdtController;
