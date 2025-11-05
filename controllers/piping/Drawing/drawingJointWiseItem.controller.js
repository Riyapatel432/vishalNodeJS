const Drawing = require("../../../models/piping/Drawing/drawing.model");
const MaterialWiseItem = require("../../../models/piping/Drawing/drawingMaterialItem.model");
const JointWiseItem = require("../../../models/piping/Drawing/drawingJointWiseItem.model");
const SpoolNoWiseDetail = require('../../../models/piping/Drawing/drawingSpoolNoJointDetail.model');
const ItemPiping = require("../../../models/piping/Item/itemPiping.model")
const { sendResponse } = require("../../../helper/response");
const { Status } = require("../../../utils/enum");
const { default: mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ejs = require("ejs");
const fs = require("fs");
const XLSX = require('xlsx');  // for utility functions
const XLSXStyle = require('xlsx-style');  // for styling
const puppeteer = require("puppeteer");
const path = require("path");
const URI = process.env.PDF_URL;
const PATH = process.env.PDF_PATH;
const excelJs = require('exceljs');
const moment = require('moment');
const upload = require('../../../helper/multerConfig');
var parser = require('simple-excel-to-json');

// ---------------------------------- Joint wise entry -------------------------------------



// exports.addJointEntryItem = async (req, res) => {
//   try {
//     let { 
//       drawing_id,
//       project_id,
//       _id,
//       material_items = [],
//       spool_no_id,
//       joint_no,
//       joint_type,
//       area,
//       inch_meter
//     } = req.body;

//     console.log("Received Body:", req.body);

//     //Validate required fields
//     if (!drawing_id || !joint_no || !joint_type) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields (drawing_id, spool_no_id, joint_no, joint_type)"
//       });
//     }

//     //Convert to ObjectIds
//     const toObjectId = (id) =>
//       mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : undefined;

//     drawing_id = toObjectId(drawing_id);
//     project_id = toObjectId(project_id);
//     spool_no_id = toObjectId(spool_no_id);
//     joint_type = toObjectId(joint_type);

//     // Extract valid material item IDs
//     let validMaterialIds = [];
//     if (Array.isArray(material_items) && material_items.length > 0) {
//       const allIds = material_items.flatMap(obj => [obj.item1_id, obj.item2_id]).filter(Boolean);

//       const filteredIds = allIds
//         .filter(id => mongoose.isValidObjectId(id))
//         .map(id => new mongoose.Types.ObjectId(id));

//       if (filteredIds.length > 0) {
//         validMaterialIds = await MaterialWiseItem.find({
//   // item: { $in: filteredIds },
//   // deleted: false,
// }).distinct('_id');

//         console.log("validMaterialIds",validMaterialIds);
//       }
//     }

//     //  Update if _id exists
//     if (_id) {
//       const updated = await JointWiseItem.findByIdAndUpdate(
//         _id,
//         {
//           drawing_id,
//           project_id,
//           material_items: validMaterialIds,
//           spool_no_id,
//           joint_no,
//           joint_type,
//           area,
//           inch_meter,
//         },
//         { new: true }
//       );

//       return res.status(200).json({
//         success: true,
//         message: "Joint entry updated successfully",
//         data: updated,
//       });
//     }

//     // Create new record
//     const newEntry = new JointWiseItem({
//       drawing_id,
//       project_id,
//       material_items: validMaterialIds,
//       spool_no_id,
//       joint_no,
//       joint_type,
//       area,
//       inch_meter,
//     });

//     await newEntry.save();

//     return res.status(201).json({
//       success: true,
//       message: "Joint entry added successfully",
//       data: newEntry,
//     });

//   } catch (error) {
//     console.error(" Error in addJointEntryItem:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

exports.addJointEntryItem = async (req, res) => {
  try {
    let {
      drawing_id,
      project_id,
      _id,
      spool_no_id,
      material_items = [],
      area,
      inch_meter,
    } = req.body;

    console.log("📩 Received Body:", req.body);

    // ✅ Validate required
    if (!drawing_id || !spool_no_id || !Array.isArray(material_items) || material_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (drawing_id, spool_no_id, material_items)",
      });
    }

    const toObjectId = (id) =>
      mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;

    // ✅ Format material_items
const formattedItems = material_items
  .filter((item) => Array.isArray(item.material_item_id) && item.material_item_id.length > 0)
  .map((item) => ({
    material_item_id: item.material_item_id
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id)),
    joint_no: item.joint_no,
    joint_type: toObjectId(item.joint_type),
  }));


    if (formattedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid material items found",
      });
    }

    // ✅ Update case
    if (_id) {
      const updated = await JointWiseItem.findByIdAndUpdate(
        _id,
        {
          drawing_id: toObjectId(drawing_id),
          project_id: toObjectId(project_id),
          spool_no_id: toObjectId(spool_no_id),
          material_items: formattedItems,
          area,
          inch_meter,
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Joint entry updated successfully",
        data: updated,
      });
    }

    // ✅ Create case
    const newEntry = await JointWiseItem.create({
      drawing_id: toObjectId(drawing_id),
      project_id: toObjectId(project_id),
      spool_no_id: toObjectId(spool_no_id),
      material_items: formattedItems,
      area,
      inch_meter,
    });

    res.status(201).json({
      success: true,
      message: "Joint entry added successfully",
      data: newEntry,
    });
  } catch (error) {
    console.error("❌ Error in addJointEntryItem:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteJointEntryItem = async (req, res) => {
  const { id } = req.params; // <-- this is the nested item _id

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  if (!id) {
    return sendResponse(res, 400, false, {}, "Item id is required");
  }

  try {
    // Find the drawing that contains the item and remove it
    const updatedDrawing = await JointWiseItem.findOneAndUpdate(
      { "joint_wise_entry_items._id": id },
      { $pull: { joint_wise_entry_items: { _id: id } } },
      { new: true }
    );

    if (!updatedDrawing) {
      return sendResponse(res, 404, false, {}, "Item not found");
    }

    return sendResponse(res, 200, true, updatedDrawing, "Joint entry item deleted successfully");
  } catch (error) {
    console.error("Delete joint entry item error:", error);
    return sendResponse(res, 500, false, {}, error.message);
  }
};

exports.getJointEntryItems = async (req, res) => {
  try {
    const { drawing_id, spool_no_id } = req.body;
    console.log("📥 Query Params:", req.body);

    // ✅ Validate input
    if (!drawing_id && !spool_no_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one filter (drawing_id or spool_no_id)",
      });
    }

    // ✅ Build filter
    const filter = {};
    if (drawing_id) filter.drawing_id = drawing_id;
    if (spool_no_id) filter.spool_no_id = spool_no_id;

const entries = await JointWiseItem.find(filter)
  .populate({ path: "drawing_id", select: "drawing_no rev_no" })
  .populate({ path: "project_id", select: "project_name client_name" })
  .populate({ path: "spool_no_id", select: "spool_no" })

  // 1️⃣ Populate array items from piping-drawing-material-items
  .populate({
    path: "material_items.material_item_id",
    model: "piping-drawing-material-items",
    select: "item qty",
    populate: {
      path: "item",
      model: "piping-items",
      select: "item_name size thickness"
    }
  })

  // 2️⃣ Populate joint type
  .populate({
    path: "material_items.joint_type",
    model: "piping-joint-type",
    select: "name"
  })
  .lean();

 
    if (!entries?.length) {
      return res.status(404).json({
        success: false,
        message: "No joint entries found for given criteria",
      });
    }

const formattedEntries = entries.map((entry) => ({
  drawing_id: entry.drawing_id,
  project_id: entry.project_id,
  spool_no_id: entry.spool_no_id,
  area: entry.area,
  inch_meter: entry.inch_meter,
  createdAt: entry.createdAt,

  material_items: entry.material_items.map(m => ({
    joint_no: m.joint_no,
    joint_type: m.joint_type,
    material_item_id: m.material_item_id // ✅ contains item + qty populated
  }))
}));


    return res.status(200).json({
      success: true,
      message: "Joint entries fetched successfully",
      count: formattedEntries.length,
      data: formattedEntries,
    });
  } catch (error) {
    console.error("❌ Error in getJointEntryItems:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching joint entries",
      error: error.message,
    });
  }
};


