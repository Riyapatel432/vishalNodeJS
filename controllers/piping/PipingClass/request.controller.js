const RequestModal = require("../../../models/piping/PipingClass/request.model");
const { sendResponse } = require("../../../helper/response");
const { OrderTypes } = require("../../../utils/enum");
const TransactionItems = require("../../../models/store/transaction_item.model");
const AdminModal = require("../../../models/admin.model");
const ejs = require("ejs");
const fs = require("fs");
const XLSX = require('xlsx');
const XLSXStyle = require('xlsx-style');
const puppeteer = require("puppeteer");
const path = require("path");
const { default: mongoose } = require("mongoose");
const { generatePDF } = require("../../../utils/pdfUtils");
const ObjectId = mongoose.Types.ObjectId;
const URI = process.env.PDF_URL;
const PATH = process.env.PDF_PATH;

const DrawingGridItems = require("../../../models/erp/planner/draw_grid_items.model")
  
exports.getStoreRequest = async (req, res) => {
  const { tag } = req.body;

  if (req.user && !req.err) {
    try {
      const filter = { deleted: false, tag };
      const data = await RequestModal.find(filter, { deleted: 0 })
        .sort({ createdAt: -1 })
        .populate({
          path: "project",
          select: "name party work_order_no",
          populate: {
            path: "party",
            select: "name",
          },
        })
        .populate("approvedBy", "name")
        .populate("preparedBy", "user_name")
        .populate("department", "name")
        .populate("firm_id", "name")
        .populate("year_id", "start_year end_year")
        .populate({
          path: "drawing_id",
          select:
            "drawing_no draw_receive_date rev assembly_no status sheet_no unit assembly_quantity drawing_pdf drawing_pdf_name issued_person issued_date",
          populate: {
            path: "issued_person",
            select: "name",
          },
        });
      const finalData = await Promise.all(
        data.map(async (elem) => {
          const items = await TransactionItems.find(
            { deleted: false, requestId: elem._id },
            { deleted: 0 }
          )
            .populate("preffered_supplier", "name email address phone")
            .populate({
              path: "itemName",
              select: "name unit material_grade",
              populate: {
                path: "unit",
                select: "name",
              },
            });

          let drawingObject = null;
          if (elem?.drawing_id !== null) {
            const drawingItems = await TransactionItems.find(
              { deleted: false, drawingId: elem?.drawing_id?._id },
              { deleted: 0, project: 0, createdAt: 0, updatedAt: 0 }
            ).populate("itemName", "name");

            drawingObject = {
              ...elem?.drawing_id.toJSON(),
              items: drawingItems,
            };
          }

          const obj = items.map((i) => ({
            _id: i?.requestId,
            transactionId: i?._id,
            itemName: i?.itemName,
            quantity: i?.quantity,
            balance_qty: i?.balance_qty,
            unit_rate: i?.unit_rate,
            total_rate: i?.total_rate,
            remarks: i?.remarks,
            tag: i?.tag,
            store_type: i?.store_type,
            requestNo: elem?.requestNo,
            requestDate: elem?.requestDate,
            preffered_supplier: i?.preffered_supplier,
            mcode: i?.mcode,
            project: elem?.project,
            drawing_id: drawingObject,
            firm_id: elem?.firm_id,
            year_id: elem?.year_id,
            itemStatus: i?.status,
            storeLocation: elem?.storeLocation,
            material_po_no: elem?.material_po_no,
            department: elem?.department,
            approvedBy: elem?.approvedBy,
            preparedBy: elem?.preparedBy,
            requestStatus: elem?.status,
          }));

          return obj;
        })
      );

      const flattenedFinalData = [].concat(...finalData);

      if (flattenedFinalData) {
        const message =
          parseInt(tag) === OrderTypes["Purchase Order"]
            ? "Purchase Request List"
            : "Sales Request List";
        sendResponse(res, 200, true, flattenedFinalData, message);
      } else {
        const message =
          parseInt(tag) === OrderTypes["Purchase Order"]
            ? "Purchase Request not found"
            : "Sale Request not found";
        sendResponse(res, 200, true, flattenedFinalData, message);
      }
    } catch (err) {
      sendResponse(res, 500, false, {}, "Something went wrong" + err);
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.getRequest = async (req, res) => {
  try {
    const { id , project} = req.query;

    const filter = { deleted: false };
    if (id) filter._id = id;
    if (project) filter.project = project;
    const data = await RequestModal.find(filter).sort({ createdAt: -1 });

    if (!data || data.length === 0) {
      return sendResponse(res, 200, true, [], "No Piping Class Request Found");
    }

    sendResponse(res, 200, true, data, "Piping Class Request List Fetched Successfully");
  } catch (error) {
    console.error("❌ Error in getRequest:", error);
    sendResponse(res, 500, false, {}, "Something went wrong while fetching requests");
  }
};


// Single Request by ID

exports.getRequestById = async (req, res) => {

  try {
    const { id } = req.query; // piping_id from frontend
    console.log("Fetching Piping Class Request with ID:", id);

    if (!id) {
      return sendResponse(res, 400, false, {}, "Missing parameter: id (piping_id)");
    }

    const data = await RequestModal.findOne({ _id: id, deleted: false });

    if (!data) {
      return sendResponse(res, 404, false, {}, "Piping Class Request not found");
    }

    return sendResponse(res, 200, true, data, "Piping Class Request fetched successfully");
  } catch (error) {
    console.error("❌ Error in getRequestById:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong while fetching the request");
  }
};


// exports.manageRequest = async (req, res) => {
//   const { id, PipingClass } = req.body;

//   if (req.user && !req.error) {
//     if (PipingClass) {
//       try {
//         // Auto-increment requestNo
//         let lastRequest = await RequestModal.findOne({ deleted: false })
//           .sort({ createdAt: -1 })
//           .select("requestNo");

//         let requestNo = lastRequest && lastRequest.requestNo
//           ? parseInt(lastRequest.requestNo) + 1
//           : 1000;

//         if (!id) {
//           // Create new request
//           const requestObject = new RequestModal({
//             PipingClass,
//             requestNo,
//           });

//           const savedRequest = await requestObject.save();

//           sendResponse(res, 200, true, savedRequest, "Piping Class request created successfully");
//         } else {
//           // Update existing request
//           const updatedRequest = await RequestModal.findByIdAndUpdate(
//             id,
//             { PipingClass },
//             { new: true }
//           );

//           if (!updatedRequest) {
//             return sendResponse(res, 404, false, {}, "Piping Class request not found");
//           }

//           sendResponse(res, 200, true, updatedRequest, "Piping Class request updated successfully");
//         }
//       } catch (error) {
//         console.error("manageRequest Error:", error);
//         sendResponse(res, 500, false, {}, "Something went wrong: " + error.message);
//       }
//     } else {
//       sendResponse(res, 400, false, {}, "Missing parameter: PipingClass");
//     }
//   } else {
//     sendResponse(res, 401, false, {}, "Unauthorized");
//   }
// };

// exports.manageChildRequest = async (req, res) => {
//   const { id, PipingClass } = req.body;

//   if (req.user && !req.error) {
//     if (PipingClass) {
//       try {
//         // Auto-increment requestNo
//         let lastRequest = await RequestModal.findOne({ deleted: false })
//           .sort({ createdAt: -1 })
//           .select("requestNo");

//         let requestNo = lastRequest && lastRequest.requestNo
//           ? parseInt(lastRequest.requestNo) + 1
//           : 1000;

//         if (!id) {
//           // Create new request
//           const requestObject = new RequestModal({
//             PipingClass,
//             requestNo,
//           });

//           const savedRequest = await requestObject.save();

//           sendResponse(res, 200, true, savedRequest, "Piping Class request created successfully");
//         } else {
//           // Update existing request
//           const updatedRequest = await RequestModal.findByIdAndUpdate(
//             id,
//             { PipingClass },
//             { new: true }
//           );

//           if (!updatedRequest) {
//             return sendResponse(res, 404, false, {}, "Piping Class request not found");
//           }

//           sendResponse(res, 200, true, updatedRequest, "Piping Class request updated successfully");
//         }
//       } catch (error) {
//         console.error("manageRequest Error:", error);
//         sendResponse(res, 500, false, {}, "Something went wrong: " + error.message);
//       }
//     } else {
//       sendResponse(res, 400, false, {}, "Missing parameter: PipingClass");
//     }
//   } else {
//     sendResponse(res, 401, false, {}, "Unauthorized");
//   }
// };


// exports.manageRequest = async (req, res) => {
//   const { id, PipingClass } = req.body;

//   // Check auth
//   if (!req.user || req.error) {
//     return sendResponse(res, 401, false, {}, "Unauthorized");
//   }

//   // Validate required parameter
//   if (!PipingClass) {
//     return sendResponse(res, 400, false, {}, "Missing parameter: PipingClass");
//   }

//   try {
//     // Auto-increment requestNo for new records
//     let lastRequest = await RequestModal.findOne({ deleted: false })
//       .sort({ createdAt: -1 })
//       .select("requestNo");

//     let requestNo = lastRequest && lastRequest.requestNo
//       ? parseInt(lastRequest.requestNo) + 1
//       : 1000;

//     let responseData;

//     if (!id) {
//       // CREATE new record
//       const requestObject = new RequestModal({
//         PipingClass,
//         requestNo,
//       });

//       responseData = await requestObject.save();
//       return sendResponse(res, 200, true, responseData, "Piping Class created successfully");

//     } else {
//       // UPDATE existing record (only update PipingClass)
//       responseData = await RequestModal.findByIdAndUpdate(
//         id,
//         { $set: { PipingClass } },
//         { new: true }
//       );

//       if (!responseData) {
//         return sendResponse(res, 404, false, {}, "Piping Class not found");
//       }

//       return sendResponse(res, 200, true, responseData, "Piping Class updated successfully");
//     }

//   } catch (error) {
//     console.error("manageRequest Error:", error);
//     return sendResponse(res, 500, false, {}, "Something went wrong: " + error.message);
//   }
// };


exports.managePipingClass = async (req, res) => {
  try {
    const { id, PipingClass, project } = req.body;
    const Items = req.body.Items || [];

    // Auth check
    if (!req.user || req.error) {
      return sendResponse(res, 401, false, {}, "Unauthorized");
    }

     if (!project) {
      return sendResponse(res, 400, false, {}, "Missing required field: Project id");
    } 
    if (!PipingClass) {
      return sendResponse(res, 400, false, {}, "Missing required field: PipingClass");
    }

    if (!id) {
      // --- CREATE ---
      const last = await RequestModal.findOne({ deleted: false })
        .sort({ createdAt: -1 })
        .select("requestNo");

      const requestNo = last && last.requestNo ? parseInt(last.requestNo) + 1 : 1000;

      const newRequest = new RequestModal({
        PipingClass,
        project,
        Items,
        requestNo
      });

      const saved = await newRequest.save();
      return sendResponse(res, 200, true, saved, "Piping Class request created successfully");

    } else {
      // --- UPDATE ---
      const updated = await RequestModal.findByIdAndUpdate(
        id,
        { PipingClass, project, Items },
        { new: true }
      );

      if (!updated) {
        return sendResponse(res, 404, false, {}, "Piping Class request not found");
      }

      return sendResponse(res, 200, true, updated, "Piping Class request updated successfully");
    }

  } catch (error) {
    console.error("managePipingClass error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong: " + error.message);
  }
};

exports.managePipingItems = async (req, res) => {
  try {
    const { piping_id, id, service, PipingMaterialSpecification } = req.body;

    // Auth check
    if (!req.user || req.error) {
      return sendResponse(res, 401, false, {}, "Unauthorized");
    }

    // Validate
    if (!piping_id) {
      return sendResponse(res, 400, false, {}, "Missing required field: piping_id");
    }

    if (!service || !PipingMaterialSpecification) {
      return sendResponse(res, 400, false, {}, "Missing required item fields");
    }

    const pipingDoc = await RequestModal.findById(piping_id);
    if (!pipingDoc) {
      return sendResponse(res, 404, false, {}, "Piping Class request not found");
    }

    if (id) {
      // --- Update existing item ---
      const existingItem = pipingDoc.Items.id(id);
      if (!existingItem) {
        return sendResponse(res, 404, false, {}, "Item not found in this Piping Class");
      }

      existingItem.service = service;
      existingItem.PipingMaterialSpecification = PipingMaterialSpecification;

    } else {
      // --- Add new item ---
      pipingDoc.Items.push({
        service,
        PipingMaterialSpecification
      });
    }

    const saved = await pipingDoc.save();
    return sendResponse(
      res,
      200,
      true,
      saved,
      id ? "Item updated successfully" : "Item added successfully"
    );

  } catch (error) {
    console.error("managePipingItems error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong: " + error.message);
  }
};


exports.deletePipingItem = async (req, res) => {
  try {
    const { piping_id, id } = req.body;

    // Auth check
    if (!req.user || req.error) {
      return sendResponse(res, 401, false, {}, "Unauthorized");
    }

    // Validate input
    if (!piping_id || !id) {
      return sendResponse(res, 400, false, {}, "Missing required fields: piping_id or id");
    }

    // Find parent document
    const pipingDoc = await RequestModal.findById(piping_id);
    if (!pipingDoc) {
      return sendResponse(res, 404, false, {}, "Piping Class request not found");
    }

    // Find the item by ID
    const item = pipingDoc.Items.id(id);
    if (!item) {
      return sendResponse(res, 404, false, {}, "Item not found in this Piping Class");
    }

    // Remove item and save
    item.deleteOne(); // or pipingDoc.Items.pull({ _id: id });
    await pipingDoc.save();

    return sendResponse(res, 200, true, pipingDoc, "Item deleted successfully");

  } catch (error) {
    console.error("deletePipingItem error:", error);
    return sendResponse(res, 500, false, {}, "Something went wrong: " + error.message);
  }
};



exports.verifyRequestStatus = async (req, res) => {
  const { id, status, adminEmail } = req.body;
  if (req.user && !req.error) {
    if (!status) {
      sendResponse(res, 400, false, {}, "Missing required field: status");
      return;
    }

    const adminId = await AdminModal.findOne({ email: adminEmail });

    try {
      await RequestModal.findByIdAndUpdate(id, {
        status: status,
        approvedBy: adminId._id,
        admin_approval_time: Date.now(),
      }).then((data) => {
        sendResponse(res, 200, true, {}, "Request status updated successfully");
      });
    } catch (err) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.deleteRequest = async (req, res) => {

  const { id } = req.body;
console.log("Request ID to delete:", id);
  try {
    const deletedRequest = await RequestModal.findByIdAndUpdate(id, {
      deleted: true,
    });
console.log("Deleted Request Result:", deletedRequest);
    if (deletedRequest) {
      sendResponse(res, 200, true, {}, "Request deleted successfully");
    } else {
      sendResponse(res, 404, false, {}, "Request not found");
    }
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, {}, "Something went wrong");
  }
};


// exports.deleteRequest = async (req, res) => {
//   const { id } = req.body;
//   if (!id) return sendResponse(res, 400, false, {}, "Missing ID");

//   try {
//     const deleted = await RequestModal.findByIdAndUpdate(id, { deleted: true });
//     if (!deleted) return sendResponse(res, 404, false, {}, "Piping Class not found");
//     sendResponse(res, 200, true, {}, "Piping Class deleted successfully");
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, false, {}, "Something went wrong");
//   }
// };

