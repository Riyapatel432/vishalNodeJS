const MaterialMto = require('../../models/material_procurement/material_mto.model');
const { downloadFormat, padWithLeadingZeros, generateExcel } = require("../../helper/index");
const {sendResponse} = require("../../helper/response");// ...existing code...
const { default: mongoose } = require("mongoose");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const URI = process.env.PDF_URL;
const PATH = process.env.PDF_PATH;
const puppeteer = require("puppeteer");
const Item = require("../../models/store/item.model");
const XLSX = require('xlsx');  // for utility functions
const XLSXStyle = require('xlsx-style');  // for styling
const upload = require('../../helper/multerConfig');
const ObjectId = mongoose.Types.ObjectId;


// ---------------- CREATE / UPDATE ----------------
exports.manageMaterialMto = async (req, res) => {
  console.log("manageMaterialMto called with body:", req.body);

  if (req.user || !req.error) {
    try {
      const { project, poNumber, date, id, created } = req.body;
      const items = req.body.items || [];

      if (!project || !poNumber || !date || !created) {
        return sendResponse(res, 400, false, {}, "Missing parameters");
      }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(project)) {
    return sendResponse(res, 400, false, {}, "Invalid project ID");
    }

      if (!id) {
        // --- CREATE ---
        const exists = await MaterialMto.findOne({
          project: new ObjectId(project),
          poNumber,
          deleted: false,
        });

        if (exists) {
          return sendResponse(res, 400, false, {}, "Material MTO already exists");
        }

        const newMto = new MaterialMto({ project, poNumber, date, created });
        const savedMto = await newMto.save();

        return sendResponse(res, 200, true, savedMto, "Material MTO created successfully");
      } else {
        // --- UPDATE ---
        const updated = await MaterialMto.findOneAndUpdate(
          { _id: id, deleted: false },
          { project, poNumber, date, items },
          { new: true }
        )
          .populate("project")
          .populate("items.item");

        // if (!updated) {
        //   return sendResponse(res, 404, false, {}, "Material MTO not found");
        // }

        return sendResponse(res, 200, true, updated, "Material MTO updated successfully");
      }
    } catch (error) {
      console.error("manageMaterialMto error:", error);
      return sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }
};


// Manage Material MTO Items (add / update)
exports.manageMtoItems = async (req, res) => {
  try {
    const {
      mto_id,   // required: existing MTO ID
      item_id,
      id,
      material_grade,
      areaBuilding,
      gadClientQty,
      fabDrawingQty,

      remarks
    } = req.body;

    console.log("manageMtoItems called with body:", req.body);

    // Validate required fields
    if (!mto_id || !item_id) {
      return sendResponse(res, 400, false, {}, "Missing required fields");
    }

    // Find existing MTO
    const mtoDoc = await MaterialMto.findById(mto_id);
    if (!mtoDoc) {
      return sendResponse(res, 404, false, {}, "Material MTO not found");
    }

    if (id) {
      // --- Update Existing Item ---
      const item = mtoDoc.items.id(id);
      if (!item) {
        return sendResponse(res, 404, false, {}, "Item not found in this MTO");
      }

      item.entryDate = new Date(new Date().setHours(0, 0, 0, 0));
      item.item = item_id;
      item.gadClientQty = gadClientQty;
      item.fabDrawingQty = fabDrawingQty;
      item.areaBuilding = areaBuilding;  
      item.remarks = remarks;

    } else {
      // --- Add New Item ---
      mtoDoc.items.push({
        entryDate: new Date(new Date().setHours(0, 0, 0, 0)),
        item: item_id,
        areaBuilding,
        gadClientQty,
        fabDrawingQty,
        remarks
      });
    }

    // ---------- Sync Material Grade with Item Master ----------
    const existingItem = await Item.findById(item_id);
    if (existingItem) {
      if (material_grade && existingItem.material_grade !== material_grade) {
        existingItem.material_grade = material_grade;
        await existingItem.save();
      }
    }

    const saved = await mtoDoc.save();
    return sendResponse(res, 200, true, saved, id ? "Item updated successfully" : "Item added successfully");

  } catch (error) {
    console.error("manageMtoItems error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

// ---------------- SET MTO STATUS TO 0 (Pending) ----------------
exports.setMtoPendingStatus = async (req, res) => {
  try {
    const { mtoId } = req.body; // get MTO ID from request

    if (!mtoId) {
      return sendResponse(res, 400, false, {}, "MTO ID is required");
    }

    const updatedMto = await MaterialMto.findByIdAndUpdate(
      mtoId,
      { status: 0 }, // set status to 0 (Pending)
      { new: true }
    );

    if (!updatedMto) {
      return sendResponse(res, 404, false, {}, "Material MTO not found");
    }

    return sendResponse(res, 200, true, updatedMto, "MTO status set to Pending successfully");
  } catch (error) {
    console.error("setMtoPendingStatus error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};


// ================ GET ALL ==================
exports.getAllMaterialMto = async (req, res) => {
  try {
    const { search, page, limit } = req.body;
    const project = req.query.project ?? req.body.project;

    // --- Base filter ---
    const filter = { deleted: false };
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      filter.project = new mongoose.Types.ObjectId(project);
    }

    const pageNum = page ? parseInt(page, 10) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;
    const skip = pageNum && limitNum ? (pageNum - 1) * limitNum : 0;

    // --- Build aggregation pipeline ---
    const pipeline = [
      { $match: filter },

      // Unwind items
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },

      // Lookup store-item details
      {
        $lookup: {
          from: "store-items",
          localField: "items.item",
          foreignField: "_id",
          as: "itemDetail"
        }
      },
      { $unwind: { path: "$itemDetail", preserveNullAndEmptyArrays: true } },

      // Lookup area details
      {
        $lookup: {
          from: "areas", // <-- collection name for Area model
          localField: "items.areaBuilding",
          foreignField: "_id",
          as: "areaDetail"
        }
      },
      { $unwind: { path: "$areaDetail", preserveNullAndEmptyArrays: true } },
        // Lookup created user
      {
        $lookup: {
          from: "users",
          localField: "created",
          foreignField: "_id",
          as: "createdUser"
        }
      },
      { $unwind: { path: "$createdUser", preserveNullAndEmptyArrays: true } },

      // Lookup updated user
      {
        $lookup: {
          from: "users",
          localField: "updated",
          foreignField: "_id",
          as: "updatedUser"
        }
      },
      { $unwind: { path: "$updatedUser", preserveNullAndEmptyArrays: true } },

      // Merge fields
      {
        $addFields: {
          "items": {
            $mergeObjects: [
              "$items",
              {
                gadClientQty: { $toString: "$items.gadClientQty" },
                fabDrawingQty: { $toString: "$items.fabDrawingQty" },
                materialRequirement: { $toString: "$items.materialRequirement" },
                orderedQty: { $toString: "$items.orderedQty" },
                balanceQty: { $toString: "$items.balanceQty" },
                materail_received: { $toString: "$items.materail_received" },
                balance_to_receive: { $toString: "$items.balance_to_receive" },

                // Join item
                item: {
                  $mergeObjects: [
                    "$itemDetail",
                    {
                      ItemId: { $toString: "$itemDetail.ItemId" },
                      purchase_rate: { $toString: "$itemDetail.purchase_rate" },
                      sale_rate: { $toString: "$itemDetail.sale_rate" },
                      cost_rate: { $toString: "$itemDetail.cost_rate" },
                      hsn_code: { $toString: "$itemDetail.hsn_code" },
                      gst_percentage: { $toString: "$itemDetail.gst_percentage" }
                    }
                  ]
                },

                // Join area
                areaBuilding: {
                  $mergeObjects: [
                    "$areaDetail",
                    {
                      _id: { $toString: "$areaDetail._id" }
                    }
                  ]
                }
              }
            ]
          },
          created: "$createdUser",
          updated: "$updatedUser"
        }
      },

      // Group back items
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          items: { $push: "$items" }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$doc", { items: "$items" }]
          }
        }
      }
    ];

    // --- Apply global search ---
    if (search && search.trim() !== "") {
      const regex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { poNumber: regex },
            { date: regex },
            { "items.remarks": regex },
            { "items.prNo": regex },
            { "items.areaBuilding.area": regex }, // <-- search by area name
            { "items.rev": regex },
            { "items.gadClientQty": regex },
            { "items.fabDrawingQty": regex },
            { "items.materialRequirement": regex },
            { "items.orderedQty": regex },
            { "items.balanceQty": regex },
            { "items.materail_received": regex },
            { "items.balance_to_receive": regex },
            { "items.item.name": regex },
            { "items.item.material_grade": regex },
            { "items.item.detail": regex },
            { "items.item.mcode": regex },
            { "items.item.ItemId": regex },
            { "items.item.purchase_rate": regex },
            { "items.item.sale_rate": regex },
            { "items.item.cost_rate": regex },
            { "items.item.hsn_code": regex },
            { "items.item.gst_percentage": regex },
          ]
        }
      });
    }

    // --- Sorting ---
    pipeline.push({ $sort: { createdAt: -1 } });

    // --- Pagination ---
    if (pageNum && limitNum) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitNum });
    }

    // --- Execute aggregation ---
    const list = await MaterialMto.aggregate(pipeline);

    // --- Count total ---
    let total = null;
    if (pageNum && limitNum) {
      const countPipeline = pipeline.filter(p => !("$skip" in p || "$limit" in p));
      total = (await MaterialMto.aggregate([...countPipeline, { $count: "total" }]))[0]?.total || 0;
    }

    return sendResponse(
      res,
      200,
      true,
      {
        data: list,
        total: total ?? list.length,
        page: pageNum || null,
        limit: limitNum || null,
        totalPages: pageNum && limitNum ? Math.ceil(total / limitNum) : null,
      },
      "Material MTO list fetched successfully"
    );
  } catch (error) {
    console.error("getAllMaterialMto error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

// ---------------- GET BY ID ----------------
exports.getMaterialMtoById = async (req, res) => {
  try {
  const id = req.query.id || req.body.id;

    console.log("getMaterialMtoById called with id:", id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, {}, "Invalid Material MTO ID");
    }

    const data = await MaterialMto.findOne({ _id: id, deleted: false })
      .populate("project")
      .populate("items.item")
      .populate("items.areaBuilding"); // <-- added Area join

    if (!data) {
      return sendResponse(res, 404, false, {}, "Material MTO not found");
    }

    return sendResponse(res, 200, true, data, "Material MTO fetched successfully");
  } catch (error) {
    console.error("getMaterialMtoById error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};


// ---------------- DELETE (SOFT) ----------------
exports.deleteMaterialMto = async (req, res) => {
  try {
    const id  = req.query.id || req.body.id;
    console.log("deleteMaterialMto called with id:", id);

    const deletedMto = await MaterialMto.findByIdAndUpdate(
      { _id: id },
      { deleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!deletedMto) {
      return sendResponse(res, 404, false, {}, "Material MTO not found");
    }

    return sendResponse(res, 200, true, {}, "Material MTO deleted successfully");
  } catch (error) {
    console.error("deleteMaterialMto error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

// ---------------- DELETE ITEM (HARD) ----------------
exports.deleteMaterialMtoItem = async (req, res) => {
  try {
    const { mto_id, id } = req.body;
    console.log("deleteMaterialMtoItem called with mtoId:", mto_id, "and item id:", id);

    if (!mto_id || !id) {
      return sendResponse(res, 400, false, {}, "MTO ID and Item ID are required");
    }

    const updatedMto = await MaterialMto.findByIdAndUpdate(
      mto_id,
      { $pull: { items: { _id: id } } },
      { new: true }
    );

    if (!updatedMto) {
      return sendResponse(res, 404, false, {}, "Material MTO or Item not found");
    }

    return sendResponse(res, 200, true, {}, "Item removed successfully");
  } catch (error) {
    console.error("deleteMaterialMtoItem error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

// PDf
// =================== DOWNLOAD MATERIAL MTO (PDF) ===================
exports.downloadMaterialMto = async (req, res) => {
  const { mto_id } = req.body;
  console.log("downloadMaterialMto called with mto_id:", mto_id);
  // Check user auth
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  // Validate ObjectId
  if (!mto_id || !mongoose.Types.ObjectId.isValid(mto_id)) {
    return sendResponse(res, 400, false, {}, "Invalid MTO ID");
  }

  const mtoObjectId = new mongoose.Types.ObjectId(mto_id);

  try {
    // Fetch Material MTO
    const materialMto = await MaterialMto.findOne({ _id: mtoObjectId, deleted: false })
      .populate("project", "name code")
      .populate("items.item", "name mcode material_grade unit")
      .populate("items.areaBuilding", "area");

    // Check if exists
    if (!materialMto) {
      console.log("Material MTO not found for ID:", mto_id);
      return sendResponse(res, 404, false, {}, "Material MTO not found");
    }

    console.log("Fetched Material MTO for PDF:", materialMto._id);

    // Render HTML template
    const templatePath = path.join(__dirname, "../../templates/material_procurement/materialMTO.html");
    const template = fs.readFileSync(templatePath, "utf-8");

    const renderedHtml = ejs.render(template, {
      mto: materialMto.toObject(),
      logoUrl1: process.env.LOGO_URL_1 || "",
      logoUrl2: process.env.LOGO_URL_2 || "",
    });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(PATH && { executablePath: PATH }),
    });
    const page = await browser.newPage();
    await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "legal",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "10px", right: "10px" },
    });

    await browser.close();

    // Ensure /pdfs folder exists
    const pdfsDir = path.join(__dirname, "../../pdfs");
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }

    const filename = `MaterialMTO_${Date.now()}.pdf`;
    const filePath = path.join(pdfsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    const fileUrl = `${URI}/pdfs/${filename}`;
    console.log("Generated Material MTO PDF URL:", fileUrl);

    return sendResponse(res, 200, true, { file: fileUrl }, "Material MTO PDF generated successfully");
  } catch (error) {
    console.error("downloadMaterialMto error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong while generating PDF");
  }
};

