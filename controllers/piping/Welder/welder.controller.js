const mongoose = require("mongoose");
const Welder = require("../../../models/piping/Welder/welder.model"); // adjust path if needed
const { sendResponse } = require("../../../helper/response");

const WelderController = {
  // CREATE or UPDATE Welder
  saveWelder: async (req, res) => {
    try {
      let {
        _id,
        name,
        welderNo,
        wpsNo,
        jointType,
        MinimumThickness,
        MaximumThickness,
        weldingProcess,
        QualifiedDiametermin,
        QualifiedDiametermax,
        due_date,
        pdf
      } = req.body;

      // Parse jointType if sent as string
      if (typeof jointType === "string") {
        try {
          jointType = JSON.parse(jointType);
        } catch (err) {
          return res.status(400).json({ success: false, message: "Invalid jointType format" });
        }
      }

      // Convert numeric fields
      MinimumThickness = MinimumThickness ? Number(MinimumThickness) : undefined;
      MaximumThickness = MaximumThickness ? Number(MaximumThickness) : undefined;

      let welder;

      if (_id) {
        // Update only provided fields
        const updateData = {
          ...(name && { name }),
          ...(welderNo && { welderNo }),
          ...(wpsNo && { wpsNo }),
          ...(jointType && { jointType }),
          ...(MinimumThickness !== undefined && { MinimumThickness }),
          ...(MaximumThickness !== undefined && { MaximumThickness }),
          ...(weldingProcess && { weldingProcess }),
          ...(QualifiedDiametermin && { QualifiedDiametermin }),
          ...(QualifiedDiametermax && { QualifiedDiametermax }),
          ...(due_date && { due_date }),
          ...(pdf && { pdf })
        };

        welder = await Welder.findByIdAndUpdate(
          _id,
          updateData,
          { new: true, runValidators: true }
        );
      } else {
        // Create new
        welder = new Welder({
          name,
          welderNo,
          wpsNo,
          jointType,
          MinimumThickness,
          MaximumThickness,
          weldingProcess,
          QualifiedDiametermin,
          QualifiedDiametermax,
          due_date,
          pdf
        });
        await welder.save();
      }

      res.status(200).json({ success: true, message: _id ? "Welder updated successfully" : "Welder created successfully", data: welder });
    } catch (err) {
      console.error("❌ saveWelder error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },


  // GET All Welders
 getAllWelder: async (req, res) => {
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
          { name: regex },
          { welderNo: regex },
          { weldingProcess: regex },
          // if wpsNo is populated and you want to search inside -> need aggregate
        ];
      });
    }

    // 👉 count total
    const total = await Welder.countDocuments(query);

    // 👉 fetch with populate + pagination
    const welderList = await Welder.find(query, { __v: 0, deletedAt: 0 })
      .populate("wpsNo", "")
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
        data: welderList,
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
      },
      "Welder list fetched successfully"
    );
  } catch (error) {
    console.error("❌ getAllWelder error:", error);
    sendResponse(res, 500, false, "Server Error", null, error.message);
  }
},


 getWelderById: async (req, res) => {
  try {
    const welder = await Welder.findById(req.params.id)
      .populate("wpsNo", "wpsNo weldingProcess jointType")
      .populate("jointType.jointId", "name");

    if (!welder) {
      return res.status(404).json({ success: false, message: "Welder not found" });
    }

    res.status(200).json({ success: true, data: welder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
},



  // DELETE Welder (soft delete)
  deleteWelder: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
      }

      const welder = await Welder.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
      );

      if (!welder) {
        return res.status(404).json({ success: false, message: 'Welder not found' });
      }

      res.status(200).json({ success: true, message: 'Welder deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },
};

module.exports = WelderController;
