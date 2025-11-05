
const FimPackingList = require("../../../models/erp/FIM/FimPackingList.model.js"); // adjust path
const { downloadFormat, padWithLeadingZeros, generateExcel } = require("../../../helper/index");
const {sendResponse} = require("../../../helper/response");// ...existing code...
const { default: mongoose } = require("mongoose");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const URI = process.env.PDF_URL;
const PATH = process.env.PDF_PATH;
const puppeteer = require("puppeteer");
const Item = require("../../../models/store/item.model");
const XLSX = require('xlsx');  // for utility functions
const XLSXStyle = require('xlsx-style');  // for styling
const upload = require('../../../helper/multerConfig');


const ObjectId = mongoose.Types.ObjectId;
// ----------------- Create / Update -----------------



// Manage FIM Packing (create / update)
exports.manageFimPackingList = async (req, res) => {
  console.log("manageFimPackingList called with body:", req.body);

  if (req.user || !req.error) {
   

  try {
    const {
      project,
      packing_no,
      packing_date,
      rgp_no,
      fim_lot_no,
      returnable_type,
      eway_bill,
      vehicle_number,
      supplier,
      receiving_date,
      received_by,
      id,
    } = req.body;


    // --- Required Fields ---
    if (!project || !packing_no || !supplier || !received_by) {
      console.log("Missing required fields:", {
        project,
        packing_no,
        supplier,
        received_by,
      });
      return sendResponse(res, 400, false, {}, "Missing parameters");
    }

    if (!id) {
      // --- Create New ---
      const exists = await FimPackingList.findOne({
        project: new ObjectId(project),
        packing_no,
        deleted: false,
      });

      console.log("Duplicate check result:", exists);

      if (exists) {
        return sendResponse(res, 400, false, {}, "Packing list already exists");
      }

      const newPacking = new FimPackingList({
        project,
        packing_no,
        packing_date,
        rgp_no,
        fim_lot_no,
        returnable_type,
        eway_bill,
        vehicle_number,
        supplier,
        receiving_date,
        received_by,
      });


      const savedPacking = await newPacking.save();
      console.log("New packing list created:", savedPacking);

      return sendResponse(
        res,
        200,
        true,
        savedPacking,
        "Packing list created successfully"
      );
    } else {
      // --- Update Existing ---
      const updated = await FimPackingList.findByIdAndUpdate(
        id,
        {
          project,
          packing_no,
          packing_date,
          rgp_no,
          fim_lot_no,
          returnable_type,
          eway_bill,
          vehicle_number,
          supplier,
          receiving_date,
          received_by,
        },
        { new: true }
      );

      console.log("Packing list update result:", updated);

      if (updated) {
        return sendResponse(
          res,
          200,
          true,
          updated,
          "Packing list updated successfully"
        );
      } else {
        return sendResponse(res, 404, false, {}, "Packing list not found");
      }
    }
  } catch (error) {
    console.error("manageFimPackingList error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
} 
else{
   return sendResponse(res, 401, false, {}, "Unauthorized");
}
};
// Manage Fim item create / update
exports.manageFimPackingItems = async (req, res) => {
  try {
    const { fim_packing_id, id, item_id, material_grade, weight_as_per_list, numbers_as_per_list,
            received_weight, received_length, received_width, received_nos,
            status, remarks } = req.body;

    if (!fim_packing_id || !item_id) {
      return sendResponse(res, 400, false, {}, "Missing required fields");
    }

    const fimDoc = await FimPackingList.findById(fim_packing_id);
    if (!fimDoc) {
      return sendResponse(res, 404, false, {}, "FIM packing not found");
    }

    if (id) {
      // --- Update Existing Item ---
      const item = fimDoc.items.id(id);
      console.log("item to update:", item);
      if (!item) {
        return sendResponse(res, 404, false, {}, "Item not found in this packing list");
      }

      item.item_id = item_id;
      item.weight_as_per_list = weight_as_per_list;
      item.numbers_as_per_list = numbers_as_per_list;
      item.received_weight = received_weight;
      item.received_length = received_length;
      item.received_width = received_width;
      item.received_nos = received_nos;
      item.status = status;
      item.remarks = remarks;

    } else {
      // --- Add New Item ---
      fimDoc.items.push({
        item_id,
        weight_as_per_list,
        numbers_as_per_list,
        received_weight,
        received_length,
        received_width,
        received_nos,
        status,
        remarks
      });
    }

        // ---------- Sync Material Grade with Item Master ----------
      const existingItem = await Item.findById(item_id);
      console.log("Fetched item for material grade sync:", existingItem);
      if (existingItem) {
        if (material_grade && existingItem.material_grade !== material_grade) {
          existingItem.material_grade = material_grade;
          await existingItem.save();
        }
      }


    const saved = await fimDoc.save();
    console.log("Fim packing after item add/update:", saved); 
    return sendResponse(res, 200, true, saved, id ? "Item updated successfully" : "Item added successfully");

  } catch (error) {
    console.error("manageFimPackingItems error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

exports.getSampleFIMImport = async (req,res) => {
      downloadFormat(req, res, "fim_import.xlsx");
}


// import from execel  

exports.importFimItemsByName = async (req, res) => {
  if (!req.user) return sendResponse(res, 401, false, {}, "Unauthorized");

  // Use the Multer upload helper
  upload(req, res, async function (err) {
    if (err) {
      return sendResponse(res, 400, false, {}, `File upload error: ${err.message}`);
    }

    if (!req.file) {
      return sendResponse(res, 400, false, {}, "No file uploaded");
    }

    try {
      const { fim_packing_id } = req.body;
      if (!fim_packing_id) {
        return sendResponse(res, 400, false, {}, "FIM packing ID is required");
      }

      const fimDoc = await FimPackingList.findById(fim_packing_id);
      if (!fimDoc) {
        return sendResponse(res, 404, false, {}, "FIM packing not found");
      }

      // Read the uploaded Excel file from disk
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Delete the file after reading
      fs.unlinkSync(req.file.path);

      if (!rows.length) {
        return sendResponse(res, 400, false, {}, "Excel file is empty");
      }

      let importedCount = 0;

      for (const row of rows) {
        const name = row['SECTION DETAILS'];
        const material_grade = row['MATERIAL GRADE'];
        const weight_as_per_list = row['WEIGHT AS PER PACKING LIST (Kg)'];
        const numbers_as_per_list = row['NUMBERS AS PER PACKING LIST (Kg)'];
        const received_weight = row['RECEIVED WEIGHT (Kg)'];
        const received_length = row['RECEIVED LENGTH (MM)'];
        const received_width = row['RECEIVED WIDTH (MM)'];
        const received_nos = row['RECEIVED NOS'];
        const remarks = row['REMARKS']; // optional

        console.log(row)

        if (!name) continue; // skip rows without name

        const item = await Item.findOne({ name });
        if (!item) continue; // skip if item not found

        fimDoc.items.push({
          item_id: item._id,
          material_grade: material_grade || item.material_grade,
          weight_as_per_list,
          numbers_as_per_list,
          received_weight,
          received_length,
          received_width,
          received_nos,
          remarks,
        });

        if (material_grade && item.material_grade !== material_grade) {
          item.material_grade = material_grade;
          await item.save();
        }

        importedCount = importedCount + 1;
      }

      console.log(importedCount);

      await fimDoc.save();

      return sendResponse(
        res,
        200,
        true,
        { importedCount, items: fimDoc.items },
        `${importedCount} items imported successfully`
      );

    } catch (error) {
      console.error("importFimItemsByName error:", error);
      return sendResponse(res, 500, false, {}, "Something went wrong during import");
    }
  });
};

// Send to QC
exports.sendFimPackingToQC = async (req, res) => {
  try {
    const { fim_id } = req.body;
    const qcUser = req.user?._id; // who is sending it to QC

    if (!fim_id) {
      return sendResponse(res, 400, false, {}, "FIM Packing List ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(fim_id)) {
      return sendResponse(res, 400, false, {}, "Invalid FIM Packing List ID");
    }

     const existingFim = await FimPackingList.findById(fim_id);
      if (!existingFim) {
        return sendResponse(res, 404, false, {}, "FIM Packing List not found");
      }

      if (existingFim.send_to_qc === true) {
        return sendResponse(res, 400, false, {}, "FIM Packing List already sent to QC");
      }

    if (!existingFim.items || existingFim.items.length === 0) {
          return sendResponse(res, 400, false, {}, "Cannot send to QC: no items found in packing list");
    }

    // Update document
    const updatedFim = await FimPackingList.findByIdAndUpdate(
      fim_id,
      {
        status: "1", // Send to QC
        send_to_qc: true,
        qc_by: qcUser,
        qc_timestamp: new Date(),
      },
      { new: true }
    );

    if (!updatedFim) {
      return sendResponse(res, 404, false, {}, "FIM Packing List not found");
    }

    return sendResponse(res, 200, true, updatedFim, "FIM Packing List sent to QC");
  } catch (error) {
    console.error("sendFimPackingToQC error:", error);
    return sendResponse(res, 500, false, {}, "Internal server error");
  }
};


exports.deleteFimPackingItem = async (req, res) => {
  try {
    const { fim_packing_id, id } = req.body;

    const fimDoc = await FimPackingList.findById(fim_packing_id);
    if (!fimDoc) {
      return sendResponse(res, 404, false, {}, "FIM packing not found");
    }

    // fimDoc.items.id(id).remove();
    fimDoc.items.pull(id);

    const saved = await fimDoc.save();

    return sendResponse(res, 200, true, saved, "Item deleted successfully");
  } catch (error) {
    console.error("deleteFimPackingItem error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

exports.getFimPackingListById = async (req, res) => {
  // console.log("getFimPackingListById called with params:", req.query);
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  try {
    const { fim_id } = { ...req.query, ...req.body };

    if (!mongoose.Types.ObjectId.isValid(fim_id)) {
      return sendResponse(res, 400, false, {}, "Invalid FIM Packing List ID");
    }

    const packingList = await FimPackingList.findOne({ _id: fim_id, deleted: false })
      .populate("project", "name code") // only needed fields
      .populate("received_by", "full_name email")
      .populate("items.item_id", "name code unit material_grade"); // fetch item details

    if (!packingList) {
      return sendResponse(res, 404, false, {}, "FIM Packing List not found");
    }

    return sendResponse(res, 200, true, packingList, "FIM Packing List fetched successfully");
  } catch (error) {
    console.error("Error fetching FIM Packing List:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

// exports.getFimPackingListsByProject = async (req, res) => {
//   if (!req.user || req.error) {
//     return sendResponse(res, 401, false, {}, "Unauthorized");
//   }

//   try {
//     const { project , status } = { ...req.query, ...req.body };

//     if (!mongoose.Types.ObjectId.isValid(project)) {
//       return sendResponse(res, 400, false, {}, "Invalid project ID");
//     }

//     const packingLists = await FimPackingList.find({ project: project, deleted: false })
//       .populate("project", "name code")
//       .populate("received_by", "user_name email")
//       .populate("items.item_id", "name code unit");

//     if (status) {
//       packingLists = packingLists.filter(list => list.status === status);
//     }

//     return sendResponse(res, 200, true, packingLists, "FIM Packing Lists fetched successfully");
//   } catch (error) {
//     console.error("Error fetching FIM Packing Lists by project:", error);
//     return sendResponse(res, 500, false, {}, "Something went wrong");
//   }
// };


exports.getFimPackingListsByProject = async (req, res) => {
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  try {
    const { project,  page, limit, } = req.body;
    const { status, search  } = req.query;
    console.log("search",search);

    // ---------- Base filter ----------
    const filter = { deleted: false };
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      filter.project = new mongoose.Types.ObjectId(project);
    }
    if (status) {
      filter.status = Number(status);
    }

    // ---------- Pagination (optional) ----------
    const pageNumber = page ? parseInt(page) : null;
    const limitNumber = limit ? parseInt(limit) : null;
    const skip = pageNumber && limitNumber ? (pageNumber - 1) * limitNumber : 0;

    // ---------- Search (regex across FIM + project + item fields) ----------
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchQuery = {
        $or: [
          { packing_no: regex },
          { rgp_no: regex },
          { fim_lot_no: regex },
          { eway_bill: regex },
          { vehicle_number: regex },
          { supplier: regex },
          { "project.name": regex },
          { "project.code": regex },
          { "items.item_id.name": regex },
          { "items.item_id.code": regex },
          { "items.item_id.material_grade": regex },
          { "items.item_id.unit.name": regex },
        ],
      };
    }

    // ---------- Aggregation Pipeline ----------
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "bussiness-projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      {
        $lookup: {
          from: "users",
          localField: "received_by",
          foreignField: "_id",
          as: "received_by",
        },
      },
      { $unwind: { path: "$received_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "store-items",
          localField: "items.item_id",
          foreignField: "_id",
          as: "items_info",
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              as: "i",
              in: {
                $mergeObjects: [
                  "$$i",
                  {
                    item_id: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$items_info",
                            cond: { $eq: ["$$this._id", "$$i.item_id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $match: searchQuery },
      { $sort: { createdAt: -1 } },
    ];

    pipeline.push({
        $project: {
          _id: 1,
          packing_no: 1,
          packing_date: 1,
          vehicle_number: 1,
          rgp_no: 1,
          fim_lot_no: 1,
          supplier: 1,
          status: 1,
          send_to_qc: 1,
          createdAt: 1,

          project: { _id: 1, name: 1, code: 1 },
          received_by: { _id: 1, user_name: 1, email: 1 },

          items: 1 
        }
      });

    // ---------- Facet for pagination ----------
    if (pageNumber && limitNumber) {
      pipeline.push({
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNumber }],
          totalCount: [{ $count: "count" }],
        },
      });
    } else {
      pipeline.push({
        $facet: {
          data: [{ $match: {} }], // return all
          totalCount: [{ $count: "count" }],
        },
      });
    }

    // ---------- Run aggregation ----------
    const packingLists = await FimPackingList.aggregate(pipeline);
    const result = packingLists[0] || { data: [], totalCount: [] };
    const totalItems = result.totalCount.length > 0 ? result.totalCount[0].count : 0;

    return sendResponse(
      res,
      200,
      true,
      {
        data: result.data,
        pagination:
          pageNumber && limitNumber
            ? {
                totalItems,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalItems / limitNumber),
                limit: limitNumber,
              }
            : null,
      },
      "FIM Packing Lists fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching FIM Packing Lists by project:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};



exports.updateFimPackingStatus = async (req, res) => {
  try {
    const { id } = req.body;
    let status = req.body.status;
    console.log("updateFimPackingStatus called with:", req.body);

    switch (status) {
      case "Pending": status = "0"; break;
      case "Partially Approved": status = "1"; break;
      case "Approved": status = "2"; break;
      case "Rejected": status = "3"; break;
      default:
        return sendResponse(res, 400, false, {}, "Invalid status value");
    }

    console.log("Mapped status value:", status);

    // Validate required fields
    if (!id || !status) {
      return sendResponse(res, 400, false, {}, "Missing required parameters (id or status)");
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, {}, "Invalid FIM Packing List ID");
    }

    // Update FIM status
    const updatedFim = await FimPackingList.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedFim) {
      return sendResponse(res, 404, false, {}, "FIM Packing List not found");
    }

     switch (updatedFim.status) {
      case 0: updatedStatus = "Pending"; break;
      case 1: updatedStatus = "Partially Approved"; break;
      case 2: updatedStatus = "Approved"; break;
      case 3: updatedStatus = "Rejected"; break;
      default:
        return sendResponse(res, 400, false, {}, "Invalid status value");
    }


    return sendResponse(
      res,
      200,
      true,
      updatedFim,
      `FIM status updated to ${updatedStatus}`
    );
  } catch (error) {
    console.error("Error updating FIM status:", error);
    return sendResponse(res, 500, false, {}, "Internal server error");
  }
};
// =================== DOWNLOAD ONE FIM (PDF) ===================
exports.downloadFimPackingList = async (req, res) => {
  const { fim_id, print_date } = req.body;

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  try {
    // 🔹 Fetch packing list with populated fields
    const packingList = await FimPackingList.findOne({ _id: fim_id, deleted: false })
      .populate("project", "name code")
      .populate("received_by", "user_name email")
      .populate("items.item_id", "name code unit material_grade");

      console.log("Fetched packing list for PDF:", packingList);

    if (!packingList) {
      return sendResponse(res, 404, false, {}, "FIM Packing List not found");
    }

    // 🔹 Render HTML using template (FIMbyid.html)
    const template = fs.readFileSync("templates/FIMbyid.html", "utf-8");
    const renderedHtml = ejs.render(template, {
      fim: packingList.toObject(),
      logoUrl1: process.env.LOGO_URL_1,
      logoUrl2: process.env.LOGO_URL_2,
    });

    // 🔹 Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: PATH,
    });
    const page = await browser.newPage();

    await page.setContent(renderedHtml, { baseUrl: `${URI}` });

    // 🔹 Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "10px", right: "10px" },
    });

    await browser.close();

    // 🔹 Save PDF in /pdfs folder
    const pdfsDir = path.join(__dirname, "../../../pdfs");
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir);
    }

    const filename = `FIM_${Date.now()}.pdf`;
    const filePath = path.join(pdfsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    const fileUrl = `${URI}/pdfs/${filename}`;

    console.log("Generated PDF URL:", fileUrl);

    return sendResponse(res, 200, true, { file: fileUrl }, "FIM PDF generated successfully");
  } catch (error) {
    console.error("downloadFimPackingList error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong while generating PDF");
  }
};

// =================== DOWNLOAD FIM PACKING LIST (EXCEL) ===================
exports.downloadFimPackingListExcel = async (req, res) => {
  const { fim_id } = req.body;

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  try {
    const packingList = await FimPackingList.findOne({ _id: fim_id, deleted: false })
      .populate("project", "name code")
      .populate("received_by", "user_name email")
      .populate("items.item_id", "name code unit material_grade");

    if (!packingList) {
      return sendResponse(res, 404, false, {}, "FIM Packing List not found");
    }

    const wsData = [];

    // Headers
    wsData.push(["VISHAL ENTERPRISE & VRISHAL ENGINEERING PRIVATE LIMITED"]);
    wsData.push(["GROUP OF COMPANIES"]);
    wsData.push(["FIM PACKING LIST - STRUCTURE (FIM INSPECTION OFFER LIST)"]);
    wsData.push([]);

    // Client / Project / Dates
    wsData.push([
      "CLIENT", packingList.client || "--",
      "RECEIVING DATE", packingList.receiving_date ? new Date(packingList.receiving_date).toLocaleDateString() : "--"
    ]);
    wsData.push([
      "PROJECT", packingList.project?.name || "--",
      "RECEIVED BY", packingList.received_by?.user_name || "--"
    ]);
    wsData.push([
      "PACKING LIST NO.", packingList.packing_list_no || "--",
      "PACKING LIST DATE", packingList.packing_date ? new Date(packingList.packing_date).toLocaleDateString() : "--"
    ]);
    wsData.push([
      "RGP NO.", packingList.rgp_no || "--",
      "FIM LOT NO.", packingList.fim_lot_no || "--"
    ]);
    wsData.push([
      "RETURNABLE/NON RETURNABLE", packingList.returnable_type || "--",
      "VEHICLE NUMBER", packingList.vehicle_number || "--"
    ]);
    wsData.push([
      "E-WAY BILL", packingList.eway_bill || "--",
      "SUPPLIER", packingList.supplier || "--"
    ]);
    wsData.push([]);

    // Table Headers
    wsData.push([
      "Sr. No.",
      "Section Details",
      "Material Grade",
      "Weight as per Packing List (Kg)",
      "Numbers as per Packing List",
      "Received Weight (Kg)",
      "Received Length (MM)",
      "Received Width (MM)",
      "Received Nos",
      "Rejected Weight (Kg)",
      "Rejected Length (MM)",
      "Rejected Width (MM)",
      "Rejected Nos",
      "Remarks",
    ]);

    // Items
    packingList.items.forEach((item, idx) => {
      wsData.push([
        idx + 1,
        item.item_id?.name || "--",
        item.material_grade || "--",
        item.weight_as_per_list || 0,
        item.numbers_as_per_list || 0,
        item.received_weight || 0,
        item.received_length || 0,
        item.received_width || 0,
        item.received_nos || 0,
        item.rejected_weight || 0,
        item.rejected_length || 0,
        item.rejected_width || 0,
        item.rejected_nos || 0,
        item.remarks || "--",
      ]);
    });

    wsData.push([]);
    wsData.push([
      "RECEIVED BY", "",
      "SIGNATURE", "",
      "PASS NO.", packingList.pass_no || "--",
      "DATE", packingList.receive_date ? new Date(packingList.receive_date).toLocaleDateString() : "--"
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 🔹 Apply merges
    ws["!merges"] = [
      // Top headers
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Group of Companies
      { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } }, // Title

      // Client / Receiving Date
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      { s: { r: 4, c: 2 }, e: { r: 4, c: 5 } },
      { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },

      // Project / Received By
      { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
      { s: { r: 5, c: 2 }, e: { r: 5, c: 5 } },
      { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },

      // Packing List No / Date
      { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
      { s: { r: 6, c: 2 }, e: { r: 6, c: 5 } },
      { s: { r: 6, c: 6 }, e: { r: 6, c: 7 } },

      // RGP No / FIM Lot
      { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
      { s: { r: 7, c: 2 }, e: { r: 7, c: 5 } },
      { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },

      // Returnable / Vehicle
      { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
      { s: { r: 8, c: 2 }, e: { r: 8, c: 5 } },
      { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },

      // E-way Bill / Supplier
      { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
      { s: { r: 9, c: 2 }, e: { r: 9, c: 5 } },
      { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FIM Packing List");

    // Save file
    const excelDir = path.join(__dirname, "../../../xlsx");
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir);
    }

    const filename = `FIM_${Date.now()}.xlsx`;
    const filePath = path.join(excelDir, filename);
    XLSX.writeFile(wb, filePath);

    const fileUrl = `${process.env.PDF_URL}/excels/${filename}`;
    return sendResponse(res, 200, true, { file: fileUrl }, "Excel generated successfully");

  } catch (error) {
    console.error("downloadFimPackingListExcel error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong while generating Excel");
  }
};


// Verify 
exports.verifyFimPacking = async (req, res) => {
  try {
    const { id, qc_name, qc_notes, items } = req.body;
    const qcUser = req.user?._id; // logged in user from middleware
    console.log("qcUser", req.body);


    if (!id) {
      return res.status(400).json({ success: false, message: "FIM ID is required" });
    }

    let parsedItems = [];
    try {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid items data" });
    }

    // Fetch FIM
    const fim = await FimPackingList.findById(id);
    if (!fim) {
      return res.status(404).json({ success: false, message: "FIM not found" });
    }

    // Update items (match by _id)
    fim.items = fim.items.map((item) => {
      const updated = parsedItems.find((u) => String(u._id) === String(item._id));
      if (updated) {
        return {
          ...item.toObject(),
          received_weight: updated.received_weight ?? item.received_weight,
          received_length: updated.received_length ?? item.received_length,
          received_width: updated.received_width ?? item.received_width,
          received_nos: updated.received_nos ?? item.received_nos,
          rejected_weight: updated.rejected_weight ?? item.rejected_weight,
          rejected_length: updated.rejected_length ?? item.rejected_length,
          rejected_width: updated.rejected_width ?? item.rejected_width,
          rejected_nos: updated.rejected_nos ?? item.rejected_nos,
          status: updated.qc_status == true ? 1 : 2,
          remarks: updated.remarks ?? item.remarks,
        };
      }
      return item;
    });

    // Update QC info
    fim.qc_by = qcUser;
    fim.qc_timestamp = new Date();
    fim.qc_notes = qc_notes || "";
    fim.qc_name = qc_name || "";

    // 🔄 Recalculate FIM overall status
    const itemStatuses = fim.items.map((i) => i.status);
    if (itemStatuses.every((s) => s === 1)) {
      fim.status = 2; // Completed
    } else if (itemStatuses.some((s) => s === 2)) {
      fim.status = 3; // Rejected
    } else {
      fim.status = 1; // In Progress (Send to QC)
    }


    await fim.save();

    return res.json({
      success: true,
      message: "FIM verification updated successfully",
      data: fim,
    });
  } catch (err) {
    console.error("verifyFimPacking error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};


exports.exportFimPackingListExcel = async (req, res) => {
  try {
    const { project } = req.body;

    // ---------- Base filter ----------
    const filter = { deleted: false };
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      filter.project = new mongoose.Types.ObjectId(project);
    }

    // ---------- Fetch FIM Packing Lists ----------
    const packingLists = await FimPackingList.find(filter)
      .populate("project", "name code")
      .populate("received_by", "user_name email")
      .populate("items.item_id", "name code material_grade unit")
      .lean();

    // ---------- Create workbook ----------
    const wb = XLSX.utils.book_new();

    packingLists.forEach((pl, idx) => {
      const rows = [];

      // ---- Header section ----
      rows.push(["FIM Packing List", `#${idx + 1}`]);
      rows.push(["Project", `${pl.project?.name || ""} (${pl.project?.code || ""})`]);
      rows.push(["Packing No", pl.packing_no]);
      rows.push(["Packing Date", pl.packing_date ? new Date(pl.packing_date).toLocaleDateString() : ""]);
      rows.push(["RGP No", pl.rgp_no || ""]);
      rows.push(["FIM Lot No", pl.fim_lot_no || ""]);
      rows.push(["Returnable Type", pl.returnable_type || ""]);
      rows.push(["Supplier", pl.supplier || ""]);
      rows.push(["Vehicle Number", pl.vehicle_number || ""]);
      rows.push(["E-way Bill", pl.eway_bill || ""]);
      rows.push(["Received By", pl.received_by?.user_name || ""]);
      rows.push(["Receiving Date", pl.receiving_date ? new Date(pl.receiving_date).toLocaleDateString() : ""]);
      rows.push(["Status", pl.status === 0 ? "Pending" : pl.status === 1 ? "Send to QC" : pl.status === 2 ? "Completed" : "Rejected"]);
      rows.push([]); // blank row

      // ---- Items table ----
      rows.push([
        "S.No",
        "Item Code",
        "Item Name",
        "Material Grade",
        "Unit",
        "Weight as per List (Kg)",
        "Nos. as per List",
        "Received Weight",
        "Received Length (mm)",
        "Received Width (mm)",
        "Received Nos.",
        "Rejected Weight",
        "Rejected Length (mm)",
        "Rejected Width (mm)",
        "Rejected Nos.",
        "Item Status",
        "Remarks",
      ]);

      pl.items.forEach((it, i) => {
        rows.push([
          i + 1,
          it.item_id?.code || "",
          it.item_id?.name || "",
          it.item_id?.material_grade || "",
          it.item_id?.unit?.name || "",
          it.weight_as_per_list || 0,
          it.numbers_as_per_list || 0,
          it.received_weight || 0,
          it.received_length || 0,
          it.received_width || 0,
          it.received_nos || 0,
          it.rejected_weight || 0,
          it.rejected_length || 0,
          it.rejected_width || 0,
          it.rejected_nos || 0,
          it.status === 0 ? "Pending" : it.status === 1 ? "Approved" : "Rejected",
          it.remarks || "",
        ]);
      });

      rows.push([]); // blank row

      // ---- Summary ----
      rows.push([
        "Summary",
        "",
        "",
        "",
        "",
        "Total Received Weight",
        pl.items.reduce((sum, it) => sum + (it.received_weight || 0), 0),
        "Total Received Nos.",
        pl.items.reduce((sum, it) => sum + (it.received_nos || 0), 0),
        "Total Rejected Weight",
        pl.items.reduce((sum, it) => sum + (it.rejected_weight || 0), 0),
        "Total Rejected Nos.",
        pl.items.reduce((sum, it) => sum + (it.rejected_nos || 0), 0),
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Packing_${idx + 1}`);
    });

    // ---------- Save Excel to server ----------
    const excelDir = path.join(__dirname, "../../../xlsx");
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }

    const filename = `FIM_${Date.now()}.xlsx`;
    const filePath = path.join(excelDir, filename);
    XLSX.writeFile(wb, filePath);

    const fileUrl = `${process.env.PDF_URL}/excels/${filename}`;
    return sendResponse(res, 200, true, { file: fileUrl }, "Excel generated and saved successfully");
  } catch (error) {
    console.error("Excel export error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong while exporting FIM Excel");
  }
};


