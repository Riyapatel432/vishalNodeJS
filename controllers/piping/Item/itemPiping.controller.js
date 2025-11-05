
const itemPiping = require("../../../models/piping/Item/itemPiping.model");
const ItemCategory = require("../../../models/piping/ItemDetailCategory/itemDetailCategory.model");
const UOM = require("../../../models/piping/UOM/uom.model");
// const Unit = require("../../models/store/store_unit.model");
// const ItemCategory = require("../../models/store/item_category.model");
// const InventoryLoc = require("../../models/store/inventory_location.model");
const { sendResponse } = require("../../../helper/response");
const upload = require("../../../helper/multerConfig");
const xlsx = require("xlsx");
const { downloadFormat, padWithLeadingZeros, generateExcel } = require("../../../helper/index");
var parser = require('simple-excel-to-json')
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
exports.getItemDetails = async (req, res) => {
  const { is_main, project } = req.query;

  if (req.user && !req.error) {
    try {
      let query = { status: true, deleted: false };

      if (is_main !== undefined) query.is_main = is_main === "true";
      if (project) query.project = project;

      const projection = {
        item_name: 1,
        material_grade: 1,
        item_description: 1,
        size: 1,
        thickness: 1,
         item_category: 1,
        uom: 1,
        status: 1,
        is_main: 1,
        project: 1,
        createdAt: 1,
      };

      //  Fetch items from DB
      const itemData = await itemPiping.find(query, projection)
       .populate({
          path: "item_category",
          model: "piping-item-detail-category",
          select: "name",
        })
        .populate({
          path: "uom",
          model: "piping-item-uom",
          select: "name",
        })
      .sort({ createdAt: -1 });

      const response = {
        data: itemData,
        count: itemData.length,
      };

      sendResponse(res, 200, true, response, "Item list");
    } catch (err) {
      console.error("Error in getItemDetails:", err);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorised");
  }
};


// exports.manageItemDetails = async (req, res) => {
//   const {
//     id,
//     item_name,
//     item_description,
//     size,
//     thickness,
//     material_grade,
//     project,
//     item_category,
//     uom,
//     status,
//   } = req.body;

//   try {
//     if (!req.user || req.error) {
//       return sendResponse(res, 401, false, {}, "Unauthorized");
//     }

//     // 🔹 Validation
//     if (!item_name || !item_description || !size || !thickness || !material_grade) {
//       return sendResponse(res, 400, false, {}, "Missing required fields");
//     }

//     // 🔹 CREATE new item
//     if (!id) {
//       const existingItem = await itemPiping.findOne({
//         item_name: item_name.trim(),
//         item_description: item_description.trim(),
//         size,
//         thickness,
//         material_grade,
//         item_category,
//         uom,
//         project,
//         deleted: false,
//       });

//       if (existingItem) {
//         return sendResponse(res, 400, false, {}, "Item already exists");
//       }

//       const newItem = new itemPiping({
//         item_name,
//         item_description,
//         size,
//         thickness,
//         material_grade,
//           item_category,
//     uom,
//         project,
//       });

//       await newItem.save();

//       return sendResponse(res, 200, true, newItem, "Item added successfully");
//     }

//     // UPDATE existing item
//     const updatedItem = await itemPiping.findByIdAndUpdate(
//       id,
//       {
//         item_name,
//         item_description,
//         size,
//         thickness,
//         material_grade,
//           item_category,
//     uom,
//         project,
//         status,
//       },
//       { new: true }
//     );

//     if (!updatedItem) {
//       return sendResponse(res, 404, false, {}, "Item not found");
//     }

//     return sendResponse(res, 200, true, updatedItem, "Item updated successfully");
//   } catch (error) {
//     console.error("Error in manageItemDetails:", error);
//     return sendResponse(res, 500, false, {}, "Something went wrong");
//   }
// };


exports.manageItemDetails = async (req, res) => {
  const {
    id,
    item_name,
    item_description,
    size,
    thickness,
    material_grade,
    project,
    item_category,
    uom,
    status,
  } = req.body;

  try {
    if (!req.user || req.error) {
      return sendResponse(res, 401, false, {}, "Unauthorized");
    }

    // Validation
    if (!item_name || !item_description || !size || !thickness || !material_grade) {
      return sendResponse(res, 400, false, {}, "Missing required fields");
    }

    if (!item_category || !mongoose.Types.ObjectId.isValid(item_category)) {
      return sendResponse(res, 400, false, {}, "Invalid or missing item category");
    }

    if (!uom || !mongoose.Types.ObjectId.isValid(uom)) {
      return sendResponse(res, 400, false, {}, "Invalid or missing UOM");
    }

    //Ensure referenced category and uom exist
    const categoryExists = await ItemCategory.findById(item_category);
    const uomExists = await UOM.findById(uom);

    if (!categoryExists) {
      return sendResponse(res, 400, false, {}, "Item category not found");
    }
    if (!uomExists) {
      return sendResponse(res, 400, false, {}, "UOM not found");
    }

    // CREATE new item
    if (!id) {
      const existingItem = await itemPiping.findOne({
        item_name: item_name.trim(),
        item_description: item_description.trim(),
        size,
        thickness,
        material_grade,
        item_category,
        uom,
        project,
        deleted: false,
      });

      if (existingItem) {
        return sendResponse(res, 400, false, {}, "Item already exists");
      }

      const newItem = new itemPiping({
        item_name,
        item_description,
        size,
        thickness,
        material_grade,
        item_category,
        uom,
        project,
      });

      await newItem.save();

      // populate for response
      const populatedItem = await itemPiping
        .findById(newItem._id)
        .populate('item_category')
        .populate('uom');

      return sendResponse(res, 200, true, populatedItem, "Item added successfully");
    }

    // UPDATE existing item
    const updatedItem = await itemPiping.findByIdAndUpdate(
      id,
      {
        item_name,
        item_description,
        size,
        thickness,
        material_grade,
        item_category,
        uom,
        project,
        status,
      },
      { new: true }
    ).populate('item_category').populate('uom');

    if (!updatedItem) {
      return sendResponse(res, 404, false, {}, "Item not found");
    }

    return sendResponse(res, 200, true, updatedItem, "Item updated successfully");

  } catch (error) {
    console.error("Error in manageItemDetails:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};


exports.getAdminItemDetails = async (req, res) => {
  const { is_main, project, currentPage, limit, search } = req.query;

  if (req.user && !req.error) {
    try {
      let query = { deleted: false };

      if (is_main !== undefined) query.is_main = is_main === "true";
      if (project) query.project = project;

      // 🔍 Smart Search Handling
      if (search && search.trim() !== "") {
        const searchRegex = new RegExp(search, "i");
        const searchNum = Number(search);

        query.$or = [
          { item_name: { $regex: searchRegex } },
          { material_grade: { $regex: searchRegex } },
          { item_description: { $regex: searchRegex } },
        ];

        // Only include numeric fields if the search is a number
        if (!isNaN(searchNum)) {
          query.$or.push(
            { size: searchNum },
            { thickness: searchNum }
          );
        }
      }

      const pageNum = parseInt(currentPage);
      const limitNum = parseInt(limit);
      const applyPagination = !isNaN(pageNum) && !isNaN(limitNum) && limitNum > 0;

      const projection = {
        item_name: 1,
        material_grade: 1,
        item_description: 1,
        size: 1,
        thickness: 1,
         item_category: 1,
        uom: 1,
        status: 1,
        is_main: 1,
        project: 1,
        createdAt: 1,
      };

      let itemData, total;

      if (applyPagination) {
        const skip = (pageNum - 1) * limitNum;
        [total, itemData] = await Promise.all([
          itemPiping.countDocuments(query),
          itemPiping.find(query, projection)
           .populate({
          path: "item_category",
          model: "piping-item-detail-category",
          select: "name",
        })
        .populate({
          path: "uom",
          model: "piping-item-uom",
          select: "name",
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        ]);
      } else {
        itemData = await itemPiping
          .find(query, projection)
           .populate({
          path: "item_category",
          model: "piping-item-detail-category",
          select: "name",
        })
        .populate({
          path: "uom",
          model: "piping-item-uom",
          select: "name",
        })
          .sort({ createdAt: -1 })
          .lean();
        total = itemData.length;
      }

      const response = {
        data: itemData,
        pagination: {
          currentPage: applyPagination ? pageNum : 1,
          limit: applyPagination ? limitNum : total,
          total,
          totalPages: applyPagination ? Math.ceil(total / limitNum) : 1,
          hasNextPage: applyPagination ? pageNum * limitNum < total : false,
        },
      };

      sendResponse(res, 200, true, response, "Item list");
    } catch (err) {
      console.error("Error in getAdminItemDetails:", err);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorised");
  }
};


exports.downloadAdminItemDetailsList = async (req, res) => {
  try {
    const items = await itemPiping.find({}).populate("uom item_category", "name");;
console.log("items",items);
    const data = items.map((item, i) => ({
      SrNo: i + 1,
      Itemcategory: item?.item_category.name || "-",
      ItemName: item.item_name || "-",
      UOM: item.uom?.name || "-",
      Description: item.item_description || "-",
      MaterialGrade: item.material_grade || "-",
      Size: item.size || "-",
      Thickness: item.thickness || "-",
    //   Project: item.project ? item.project.project_name : "-",
    //   IsMain: item.is_main ? "Yes" : "No",
    //   CreatedAt: item.createdAt
    //     ? new Date(item.createdAt).toLocaleDateString("en-GB")
    //     : "-",
    }));
console.log("data",data);
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    ws['!cols'] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
      { wch: 15 },
      { wch: 8 },
      
 
    ];

    xlsx.utils.book_append_sheet(wb, ws, `items`);

    // const xlsxPath = path.join(__dirname, '../../xlsx');
const xlsxPath = path.join(process.cwd(), 'xlsx');

    if (!fs.existsSync(xlsxPath)) {
      fs.mkdirSync(xlsxPath, { recursive: true });
    }

    const filename = `items_${Date.now()}.xlsx`;
    const filePath = path.join(xlsxPath, filename);

    xlsx.writeFile(wb, filePath);

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const fileUrl = `${protocol}://${req.get('host')}/xlsx/${filename}`;
    sendResponse(res, 200, true, { file: fileUrl }, `XLSX file generated successfully`);

  } catch (error) {
    sendResponse(res, 500, false, {}, "Something went wrong" + error);
  }
}




