const Drawing = require("../../../models/piping/Drawing/drawing.model");
const request = require("../../../models/piping/PipingClass/request.model");
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

// ---------------------------------- Line/Drawing list -------------------------------------


exports.manageDrawingForPiping = async (req, res) => {
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }
  try {
    const {
      id,
      project,
      piping_class,
      area_unit,
      drawing_no,
      drawing_received_lot_no,
      drawing_receive_date,
      p_id_drawing_no,
      sheet_no,
      rev,
    //   assembly_no,
    //   assembly_quantity,
      drawing_pdf,
      drawing_pdf_name,
      status,
    } = req.body;

    //  Required field validation
    const requiredFields = [
      "project",
      "piping_class",
      "area_unit",
      "drawing_no",
      "drawing_received_lot_no",
      "p_id_drawing_no",
      "drawing_receive_date",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return sendResponse(
          res,
          400,
          false,
          {},
          `Missing required field: ${field}`
        );
      }
    }

    //  Prepare drawing data
    const drawingData = {
      project,
      piping_class,
      area_unit,
      drawing_no,
      drawing_received_lot_no,
      p_id_drawing_no,
      drawing_receive_date,
      sheet_no,
      rev,
    //   assembly_no,
    //   assembly_quantity: assembly_quantity || 0,
      drawing_pdf: drawing_pdf || null,
      drawing_pdf_name: drawing_pdf_name || null,
      master_updation_date: Date.now(),
      status: status,
    };

    //  CREATE new drawing
    if (!id) {
      const existing = await Drawing.findOne({
        project: new ObjectId(project),
        drawing_no,
        rev,
        // assembly_no,
        deleted: false,
      });

      if (existing) {
        return sendResponse(res, 400, false, {}, "Drawing already exists");
      }

      const newDrawing = new Drawing(drawingData);
      const saved = await newDrawing.save();

      return sendResponse(res, 200, true, saved, "Drawing added successfully");
    }

    //  UPDATE existing drawing
    const updated = await Drawing.findByIdAndUpdate(id, drawingData, {
      new: true,
    });

    if (!updated) {
      return sendResponse(res, 404, false, {}, "Drawing not found");
    }

    return sendResponse(res, 200, true, updated, "Drawing updated successfully");
  } catch (error) {
    console.error(" manageDrawing error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

exports.getDrawingForPiping = async (req, res) => {
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  try {
    const { project, piping_class, search, page, limit } = req.query;

    // 🧩 Build dynamic filter
    const filter = { deleted: false };

    if (project && ObjectId.isValid(project)) {
      filter.project = new ObjectId(project);
    }

    if (piping_class && ObjectId.isValid(piping_class)) {
      filter.piping_class = new ObjectId(piping_class);
    }

    if (search && search.trim() !== "") {
      filter.$or = [
        { drawing_no: { $regex: search, $options: "i" } },
        { p_id_drawing_no: { $regex: search, $options: "i" } },
        { drawing_received_lot_no: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination setup
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    //  Count total records
    const totalCount = await Drawing.countDocuments(filter);

    // Fetch paginated data with population
    const drawings = await Drawing.find(filter)
      .populate("project", "name")
      .populate("piping_class", "PipingClass")
      .populate("area_unit", "area")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return sendResponse(res, 200, true, {
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: drawings,
    }, "Drawings fetched successfully");

  } catch (error) {
    console.error("getDrawingForPiping error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

exports.issuePipingDrawing = async (req, res) => {
  let { id, issued_date, issued_person } = req.body;

  if (req.user && !req.error) {
    if (!id || !issued_date || !issued_person) {
      sendResponse(res, 400, false, {}, "Missing parameter");
      return;
    }

    try {
      // Always try to parse
      try {
        id = JSON.parse(id);
      } catch (e) {
        // if not JSON, leave it
      }

      let result;

      if (Array.isArray(id)) {
        result = await Drawing.updateMany(
          { _id: { $in: id } },
          {
            $set: {
              issued_date,
              issued_person,
              status: Status.Approved,
            },
          }
        );

        if (result.modifiedCount > 0) {
          sendResponse(res, 200, true, {}, "Drawings issued successfully");
        } else {
          sendResponse(res, 404, false, {}, "No drawings found to update");
        }
      } else {
        result = await Drawing.findByIdAndUpdate(
          id,
          {
            issued_date,
            issued_person,
            status: Status.Approved,
          },
          { new: true }
        );

        if (result) {
          sendResponse(res, 200, true, {}, "Drawing issued successfully");
        } else {
          sendResponse(res, 404, false, {}, "Drawing not found");
        }
      }
    } catch (err) {
      console.error("Error issuing drawings:", err);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorised");
  }
};

// ---------------------------------- Material wise entry -------------------------------------

// exports.addMaterialEntryItem = async (req, res) => {
//   try {
//     const { 
//       drawing_id, 
//       _id,                // item ID for update (optional)
//       item,
//       spool_no,
//       qty 
//     } = req.body;

//     // Validate required fields
//     if (!drawing_id) {
//       return res.status(400).json({ success: false, message: "Drawing ID is required" });
//     }
//     if (!item) {
//       return res.status(400).json({ success: false, message: "Item is required" });
//     }

//     // Find drawing by ID
//     const drawing = await Drawing.findById(drawing_id);
//     if (!drawing) {
//       return res.status(404).json({ success: false, message: "Drawing not found" });
//     }

//     // If _id is present => Update existing material entry
//     if (_id) {
//       const existingItemIndex = drawing.material_wise_entry_items.findIndex(
//         (it) => it._id.toString() === _id
//       );

//       if (existingItemIndex === -1) {
//         return res.status(404).json({
//           success: false,
//           message: "Material entry item not found for update",
//         });
//       }

//       // Update existing fields
//       drawing.material_wise_entry_items[existingItemIndex] = {
//         ...drawing.material_wise_entry_items[existingItemIndex]._doc, // retain previous fields
//         item,
//         spool_no,
//         qty,
//       };

//       await drawing.save();

//       return res.status(200).json({
//         success: true,
//         message: "Material entry item updated successfully",
//         data: drawing,
//       });
//     }

//     // Otherwise => Add new item
//     const newItem = { item, spool_no, qty };
//     drawing.material_wise_entry_items.push(newItem);
//     await drawing.save();

//     return res.status(200).json({
//       success: true,
//       message: "Material entry item added successfully",
//       data: drawing,
//     });

//   } catch (error) {
//     console.error("❌ Error adding/updating material entry:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while adding/updating material entry",
//       error: error.message,
//     });
//   }
// };

// exports.deleteMaterialEntryItem = async (req, res) => {
//   const { id } = req.params; // <-- this is the nested item _id

//   if (!req.user || req.error) {
//     return sendResponse(res, 401, false, {}, "Unauthorized");
//   }

//   if (!id) {
//     return sendResponse(res, 400, false, {}, "Item id is required");
//   }

//   try {
//     // Find the drawing that contains the item and remove it
//     const updatedDrawing = await Drawing.findOneAndUpdate(
//       { "material_wise_entry_items._id": id },
//       { $pull: { material_wise_entry_items: { _id: id } } },
//       { new: true }
//     );

//     if (!updatedDrawing) {
//       return sendResponse(res, 404, false, {}, "Item not found");
//     }

//     return sendResponse(res, 200, true, updatedDrawing, "Material entry item deleted successfully");
//   } catch (error) {
//     console.error("Delete material entry item error:", error);
//     return sendResponse(res, 500, false, {}, error.message);
//   }
// };

// exports.getMaterialEntryItems = async (req, res) => {
//   const { drawing_id } = req.body;
//   if (!req.user || req.error) {
//     return sendResponse(res, 401, false, {}, "Unauthorized");
//   }

//   if (!drawing_id || drawing_id === "null" || drawing_id === "undefined") {
//     return sendResponse(res, 400, false, {}, "Invalid drawing_id provided");
//   }

//   try {
//     // find drawing by _id
//     const drawing = await Drawing.findById(drawing_id)
//       .populate({
//         path: "project",
//         model: "bussiness-projects",
//         select: "name",
//       })
//       .populate({
//         path: "material_wise_entry_items.item",
//         model: "piping-items",
//         select: "item_category item_name item_description size thickness uom material_grade",
//       });

//     if (!drawing) {
//       return sendResponse(res, 404, false, {}, "Drawing not found");
//     }

//     const items = drawing.material_wise_entry_items || [];

//     if (items.length === 0) {
//       return sendResponse(res, 200, true, [], "No material entry items found");
//     }

//     return sendResponse(
//       res,
//       200,
//       true,
//       items,
//       "Drawing material entry items retrieved successfully"
//     );
//   } catch (error) {
//     return sendResponse(res, 500, false, {}, error.message);
//   }
// };

// exports.importMaterialEntryPiping = async (req, res) => {
//   try {
//     const { drawing_id } = req.body;

//     if (!drawing_id) {
//       return sendResponse(res, 400, false, {}, 'Drawing ID is required');
//     }

//     const drawing = await Drawing.findById(drawing_id);

//     if (!drawing) {
//       return sendResponse(res, 404, false, {}, 'Drawing not found');
//     }

//     // Check if file is uploaded
//     if (!req.file) {
//       return sendResponse(res, 400, false, {}, 'No file uploaded');
//     }

//     const filePath = path.join(__dirname, '../../../uploads', req.file.filename);
   
//     const workbook = new excelJs.Workbook();
//     await workbook.xlsx.readFile(filePath);
//     const worksheet = workbook.worksheets[0];

//     // Expected headers (ensure Excel has them)
//     const rows = [];
//     worksheet.eachRow((row, rowNumber) => {
//       if (rowNumber === 1) return; // skip header
//       const [
//         sr,
//         spool_no,
//         item_name,
//         qty,
//       ] = row.values.slice(1); // skip first empty value

//       if (!item_name) return; // skip empty rows

      

//       rows.push({
//         spool_no,
//         item_name,
//         qty,
//       });
//     });
  

//     if (!rows.length) {
//       fs.unlinkSync(filePath);
//       return sendResponse(res, 400, false, {}, 'No valid data found in Excel');
//     }

//  const missingFields = new Set();
//     rows.forEach((r) => {
//       if (!r.item_name) missingFields.add('item_name');
//        if (!r.spool_no) missingFields.add('spool_no');
//       if (r.qty == null || r.qty === '') missingFields.add('qty');
//     });

//     // ✅ If any missing fields found, return them
//     if (missingFields.size > 0) {
//       fs.unlinkSync(filePath);
//       return sendResponse(
//         res,
//         400,
//         false,
//         { missingFields: Array.from(missingFields) },
//         `Missing required fields: ${Array.from(missingFields).join(',')}`
//       );
//     }
//     // Process rows with autofetch from ItemPiping
//     const finalItems = [];

//     for (const row of rows) {
//       const itemData = await ItemPiping.findOne({ item_name: row.item_name });
     

//       if (itemData) {
//         finalItems.push({
//           item: itemData._id,
//           spool_no: row.spool_no || '',
//           qty: row.qty || 0,
//           item_category:itemData.item_category,
//           item_description: itemData.item_description || row.item_description,
//           size: itemData.size || row.size,
//           thickness: itemData.thickness || row.thickness,
//            uom: itemData.uom || '',
//           material_grade: itemData.material_grade || row.material_grade,
//         });
//       } else {
//         // If not found, still push raw row
//         finalItems.push({
//           item: row.item_name,
//           spool_no: row.spool_no,
//           qty: row.qty,
//           item_category:row.item_category,
//           item_description: row.item_description,
//           size: row.size,
//           thickness: row.thickness,
//            uom: row.uom || '',
//           material_grade: row.material_grade,
//         });
//       }
//     }

//     // Push all imported items
//     drawing.material_wise_entry_items.push(...finalItems);
//     await drawing.save();

//     // Delete uploaded file after processing
//     fs.unlinkSync(filePath);

//     return sendResponse(res, 200, true, { data: drawing }, 'Material entry items imported successfully');

//   } catch (error) {
//     console.error(' Error importing Excel:', error);
//     return sendResponse(res, 500, false, {}, 'Error importing Excel data');
//   }
// };


