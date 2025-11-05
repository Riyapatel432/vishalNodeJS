const Drawing = require("../../../models/piping/Drawing/drawing.model");
const MaterialWiseItem = require("../../../models/piping/Drawing/drawingMaterialItem.model");
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


// exports.addMaterialEntryItem = async (req, res) => {
//   try {
//     const { 
//       drawing_id, 
//       project_id,
//       _id,                // item ID for update (optional)
//       item,
//       qty 
//     } = req.body;

//     // Validate required fields
//     if (!drawing_id) {
//       return res.status(400).json({ success: false, message: "Drawing ID is required" });
//     }
//     if (!project_id) {
//       return res.status(400).json({ success: false, message: "Project ID is required" });
//     }
//     if (!item) {
//       return res.status(400).json({ success: false, message: "Item is required" });
//     }

//     // Find drawing by ID
//     const drawing = await MaterialWiseItem.findById(drawing_id);
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

exports.addMaterialEntryItem = async (req, res) => {
  try {
    const { _id, drawing_id, project_id, item, qty } = req.body;

    // validation
    if (!drawing_id || !project_id || !item)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    let result;

    if (_id) {
      // Update existing entry
      result = await MaterialWiseItem.findByIdAndUpdate(
        _id,
        { item, qty },
        { new: true }
      );

      if (!result)
        return res.status(404).json({ success: false, message: "Item not found for update" });

      return res.status(200).json({
        success: true,
        message: "Material entry item updated successfully",
        data: result,
      });
    }

    // Add new entry
    const newItem = new MaterialWiseItem({ drawing_id, project_id, item, qty });
    result = await newItem.save();

    return res.status(200).json({
      success: true,
      message: "Material entry item added successfully",
      data: result,
    });

  } catch (error) {
    console.error("❌ Error adding/updating material entry:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding/updating material entry",
      error: error.message,
    });
  }
};



exports.deleteMaterialEntryItem = async (req, res) => {
  const { id } = req.params; // <-- this is the nested item _id

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  if (!id) {
    return sendResponse(res, 400, false, {}, "Item id is required");
  }

  try {
    // Find the drawing that contains the item and remove it
    const updatedDrawing = await MaterialWiseItem.findOneAndUpdate(
      { "material_wise_entry_items._id": id },
      { $pull: { material_wise_entry_items: { _id: id } } },
      { new: true }
    );

    if (!updatedDrawing) {
      return sendResponse(res, 404, false, {}, "Item not found");
    }

    return sendResponse(res, 200, true, updatedDrawing, "Material entry item deleted successfully");
  } catch (error) {
    console.error("Delete material entry item error:", error);
    return sendResponse(res, 500, false, {}, error.message);
  }
};

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

exports.getMaterialEntryItems = async (req, res) => {
  const { drawing_id } = req.body;

  // ✅ Authorization check
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  // ✅ Validation
  if (!drawing_id || drawing_id === "null" || drawing_id === "undefined") {
    return sendResponse(res, 400, false, {}, "Invalid drawing_id provided");
  }

  try {
    // ✅ Ensure drawing exists
    const drawing = await Drawing.findById(drawing_id).populate({
      path: "project",
      model: "bussiness-projects",
      select: "name",
    });

    if (!drawing) {
      return sendResponse(res, 404, false, {}, "Drawing not found");
    }

    // ✅ Fetch material entry items for this drawing
    const items = await MaterialWiseItem.find({
      drawing_id,
      deleted: false,
    })
      .populate({
        path: "item",
        model: "piping-items",
        select: "item_category item_name item_description size thickness uom material_grade",
      })
      .populate({
        path: "project_id",
        model: "bussiness-projects",
        select: "name",
      })
      .sort({ createdAt: -1 });

    if (items.length === 0) {
      return sendResponse(res, 200, true, [], "No material entry items found");
    }

    return sendResponse(
      res,
      200,
      true,
      items,
      "Drawing material entry items retrieved successfully"
    );

  } catch (error) {
    console.error("❌ Error fetching material entry items:", error);
    return sendResponse(res, 500, false, {}, "Server error while fetching material entry items");
  }
};


exports.getDrawingImportSampleForPiping = async (req, res) => {
  if (!req.user) {
    return sendResponse(res, 401, false, {}, 'Unauthorized');
  }

  try {
    const filePath = path.join(__dirname, '../../../xlsx/drawing-item-import-sample-piping.xlsx');
    const workBook = new excelJs.Workbook();
    const worksheet = workBook.addWorksheet('Drawing-item-import');

    worksheet.columns = [
      { header: 'SR', key: 'sr', width: '5' },
      { header: 'SPOOL_NO', key: 'grid', width: '15' },
      { header: 'ITEM', key: 'item', width: '10' },
      // { header: 'ITEM_DESCRIPTION', key: 'qty', width: '40' },
      // { header: 'SIZE', key: 'length', width: '15' },
      // { header: 'THICKNESS', key: 'weight', width: '25' },
      // { header: 'MATERIAL_GRADE', key: 'assem', width: '25' },
      { header: 'UOM', key: 'as', width: '25' },
      { header: 'QTY', key: 'jt', width: '25' },
    ];

    worksheet.getRow(1).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF00' }
      };
    });

    await workBook.xlsx.writeFile(filePath);

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const fileUrl = `${protocol}://${req.get('host')}/xlsx/drawing-item-import-sample-piping.xlsx`;
    sendResponse(res, 200, true, { file: fileUrl }, 'XLSX file downloaded successfully');


  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
}

exports.importMaterialEntryPiping = async (req, res) => {
  try {
    const { drawing_id } = req.body;

    if (!drawing_id) {
      return sendResponse(res, 400, false, {}, 'Drawing ID is required');
    }

    const drawing = await Drawing.findById(drawing_id);

    if (!drawing) {
      return sendResponse(res, 404, false, {}, 'Drawing not found');
    }

    // Check if file is uploaded
    if (!req.file) {
      return sendResponse(res, 400, false, {}, 'No file uploaded');
    }

    const filePath = path.join(__dirname, '../../../uploads', req.file.filename);
   
    const workbook = new excelJs.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    // Expected headers (ensure Excel has them)
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const [
        sr,
        spool_no,
        item_name,
        qty,
      ] = row.values.slice(1); // skip first empty value

      if (!item_name) return; // skip empty rows

      

      rows.push({
        spool_no,
        item_name,
        qty,
      });
    });
  

    if (!rows.length) {
      fs.unlinkSync(filePath);
      return sendResponse(res, 400, false, {}, 'No valid data found in Excel');
    }

 const missingFields = new Set();
    rows.forEach((r) => {
      if (!r.item_name) missingFields.add('item_name');
       if (!r.spool_no) missingFields.add('spool_no');
      if (r.qty == null || r.qty === '') missingFields.add('qty');
    });

    // ✅ If any missing fields found, return them
    if (missingFields.size > 0) {
      fs.unlinkSync(filePath);
      return sendResponse(
        res,
        400,
        false,
        { missingFields: Array.from(missingFields) },
        `Missing required fields: ${Array.from(missingFields).join(',')}`
      );
    }
    // Process rows with autofetch from ItemPiping
    const finalItems = [];

    for (const row of rows) {
      const itemData = await ItemPiping.findOne({ item_name: row.item_name });
     

      if (itemData) {
        finalItems.push({
          item: itemData._id,
          spool_no: row.spool_no || '',
          qty: row.qty || 0,
          item_category:itemData.item_category,
          item_description: itemData.item_description || row.item_description,
          size: itemData.size || row.size,
          thickness: itemData.thickness || row.thickness,
           uom: itemData.uom || '',
          material_grade: itemData.material_grade || row.material_grade,
        });
      } else {
        // If not found, still push raw row
        finalItems.push({
          item: row.item_name,
          spool_no: row.spool_no,
          qty: row.qty,
          item_category:row.item_category,
          item_description: row.item_description,
          size: row.size,
          thickness: row.thickness,
           uom: row.uom || '',
          material_grade: row.material_grade,
        });
      }
    }

    // Push all imported items
    drawing.material_wise_entry_items.push(...finalItems);
    await drawing.save();

    // Delete uploaded file after processing
    fs.unlinkSync(filePath);

    return sendResponse(res, 200, true, { data: drawing }, 'Material entry items imported successfully');

  } catch (error) {
    console.error(' Error importing Excel:', error);
    return sendResponse(res, 500, false, {}, 'Error importing Excel data');
  }
};