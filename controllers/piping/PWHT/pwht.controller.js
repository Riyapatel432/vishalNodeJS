const mongoose = require("mongoose");
const PWHT = require("../../../models/piping/PWHT/pwht.model"); // adjust path if needed
const { sendResponse } = require("../../../helper/response");

const PWHTController = {
  // CREATE or UPDATE PWHT
  savePWHT: async (req, res) => {
  try {
    let { _id,  pipingClass, 
                PipingMaterialSpecification,
                pwhtType,
                LoadingTemp,
                rateofHeating,
                soakingTemp,
                soakingPeriod,
                rateofCooling,
                unloadingTemp, } = req.body;

    let pwhtDoc;

    if (_id) {
      // Update only provided fields
      const updateData = {
        ...(pipingClass && { pipingClass }),
        ...(PipingMaterialSpecification && { PipingMaterialSpecification }),
        ...(pwhtType && { pwhtType }),
        ...(LoadingTemp && { LoadingTemp }),
        ...(rateofHeating && { rateofHeating }),
        ...(soakingTemp && { soakingTemp }),
        ...(soakingPeriod && { soakingPeriod }),
        ...(rateofCooling && { rateofCooling }),
        ...(unloadingTemp && { unloadingTemp }),
      };

      pwhtDoc = await PWHT.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      pwhtDoc = new PWHT({
        pipingClass, 
        PipingMaterialSpecification,
        pwhtType,
        LoadingTemp,
        rateofHeating,
        soakingTemp,
        soakingPeriod,
        rateofCooling,
        unloadingTemp,
      });
      await pwhtDoc.save();
    }

    res.status(200).json({
      success: true,
      message: _id
        ? "PWHT updated successfully"
        : "PWHT created successfully",
      data: pwhtDoc,
    });
  } catch (err) {
    console.error("❌ savePWHT error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
},

  // GET All PWHTs
  getAllPWHT: async (req, res) => {
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
            { pwhtType: regex },
          ];
        });
      }

      const total = await PWHT.countDocuments(query);

      const PWHTList = await PWHT.find(query, { __v: 0, deletedAt: 0 })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();

      sendResponse(res, 200, true, {
          data: PWHTList,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
        },
        "PWHT list fetched successfully"
      );
    } catch (error) {
      console.error("❌ getAllPWHT error:", error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  },

  // GET PWHT by ID
  getPWHTById: async (req, res) => {
    try {
      const PWHT = await PWHT.findById(req.params.id);

      if (!PWHT) {
        return res.status(404).json({ success: false, message: "PWHT not found" });
      }

      res.status(200).json({ success: true, data: PWHT });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE PWHT (soft delete)
  deletePWHT: async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const pwhtDoc = await PWHT.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!pwhtDoc) {
      return res.status(404).json({ success: false, message: 'PWHT not found' });
    }

    res.status(200).json({ success: true, message: 'PWHT deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}

};

module.exports = PWHTController;
