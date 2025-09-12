const { sendResponse } = require('../../helper/response');
const PurchaseOffer = require("../../models/store/purchase_offer.model");
const TransactionItems = require("../../models/store/transaction_item.model");
const { TitleFormat } = require('../../utils/enum');
const ItemStock = require('../../models/store/item_stock.model');
const transaction_itemModel = require('../../models/store/transaction_item.model');
const requestModel = require('../../models/erp/planner/request.model');
const projectModel = require('../../models/project.model');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
exports.getPurchaseOffer = async (req, res) => {
  const { requestId } = req.body;

  if (req.user && !req.error) {
    try {
      const query = { deleted: false };
      if (requestId) {
        query._id = requestId;
      }

      const data = await PurchaseOffer.find(query, { deleted: 0, __v: 0 })
        .populate('offeredBy', 'user_name')
        .populate({
          path: 'requestId',
          select: 'requestNo storeLocation department preparedBy material_po_no project status approvedBy drawing_id requestDate admin_approval_time',
          populate: [
            { path: 'department', select: 'name' },
            { path: 'project', select: 'name party work_order_no', populate: { path: 'party', select: 'name' } },
            { path: 'preparedBy', select: 'user_name' },
            { path: 'approvedBy', select: 'name' },
            { path: 'storeLocation', select: 'name' },
            {
              path: 'drawing_id',
              select: 'drawing_no sheet_no assembly_no rev assembly_quantity unit drawing_pdf drawing_pdf_name items draw_receive_date status',
            }
          ]
        }).populate({ path: 'items.offer_uom', select: 'name' })
        .populate('acceptedBy', 'user_name')
        .populate({ path: 'items.manufacture', select: 'name' })
        .populate({
          path: 'items.transactionId',
          select: 'tag itemName quantity balance_qty mcode remarks store_type unit_rate total_rate preffered_supplier status main_supplier manufacture',
          populate: [
            { path: 'preffered_supplier.supId', select: 'name' },
            { path: 'itemName', select: 'name unit', populate: { path: 'unit', select: 'name' } },
            { path: 'main_supplier', select: 'name' },
          ]
        }).sort({ createdAt: -1 })
        .lean()

      if (data) {
        sendResponse(res, 200, true, data, 'Purchase offer list')
      } else {
        sendResponse(res, 400, false, {}, 'Purchase offer not found ')
      }

    } catch (err) {
      console.error("Error while getting offerList: " + err);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

// exports.updatePurchaseOffer = async (req, res) => {
//   const { offerId, updateData } = req.body;

//   if (req.user && !req.error) {
//     try {
//       const updatedOffer = await PurchaseOffer.findByIdAndUpdate(
//         offerId,
//         { $set: updateData },
//         { new: true }
//       )
//         .populate('offeredBy', 'user_name')
//         .populate('acceptedBy', 'user_name')
//         .populate({ path: 'items.manufacture', select: 'name' })
//         .populate({
//           path: 'items.offer_uom',
//           select: 'name'
//         })
//         .populate({
//           path: 'items.transactionId',
//           select: 'tag itemName quantity balance_qty mcode remarks store_type unit_rate total_rate preffered_supplier status main_supplier manufacture',
//           populate: [
//             { path: 'preffered_supplier.supId', select: 'name' },
//             { path: 'itemName', select: 'name unit', populate: { path: 'unit', select: 'name' } },
//             { path: 'main_supplier', select: 'name' },
//           ]
//         })
//         .populate({
//           path: 'requestId',
//           select: 'requestNo storeLocation department preparedBy material_po_no project status approvedBy drawing_id requestDate admin_approval_time',
//           populate: [
//             { path: 'department', select: 'name' },
//             { path: 'project', select: 'name party work_order_no', populate: { path: 'party', select: 'name' } },
//             { path: 'preparedBy', select: 'user_name' },
//             { path: 'approvedBy', select: 'name' },
//             { path: 'storeLocation', select: 'name' },
//             {
//               path: 'drawing_id',
//               select: 'drawing_no sheet_no assembly_no rev assembly_quantity unit drawing_pdf drawing_pdf_name items draw_receive_date status',
//             }
//           ]
//         })
//         .lean();

//       if (updatedOffer) {
//         sendResponse(res, 200, true, updatedOffer, 'Purchase offer updated successfully');
//       } else {
//         sendResponse(res, 404, false, {}, 'Purchase offer not found');
//       }

//     } catch (err) {
//       console.error("Error while updating offer: ", err);
//       sendResponse(res, 500, false, {}, "Something went wrong");
//     }
//   } else {
//     sendResponse(res, 401, false, {}, "Unauthorized");
//   }
// };

exports.updatePurchaseOffer = async (req, res) => {
  const { offerId, updateData } = req.body;

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  const {
    requestId,
    items,
    received_date,
    offeredBy,
    invoice_no
  } = updateData;

  if (!offerId || !requestId || !Array.isArray(items) || items.length === 0) {
    return sendResponse(res, 400, false, {}, "Missing or invalid parameters");
  }

  try {
    // Update offer data
    const updatedOffer = await PurchaseOffer.findByIdAndUpdate(
      offerId,
      {
        requestId,
        items,
        received_date,
        offeredBy,
        invoice_no
      },
      { new: true }
    );

    if (!updatedOffer) {
      return sendResponse(res, 404, false, {}, "Purchase offer not found");
    }

    // Optional: Update item remarks, etc. if needed (not included here)

    // Re-check if all related items have balance_qty = 0
    const relatedItems = await TransactionItems.find({ requestId });
    const allZeroBalance = relatedItems.every(item => item.balance_qty === 0);

    if (allZeroBalance) {
      await requestModel.findByIdAndUpdate(requestId, { status: 5 });
    }

    return sendResponse(res, 200, true, updatedOffer, "Purchase offer updated successfully");

  } catch (err) {
    console.error(" Error in updatePurchaseOffer:", err);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};


exports.sendToQc = async (req, res) => {
  const { id } = req.body;
  if (req.user && !req.error) {
    if (!id) {
      sendResponse(res, 400, false, {}, 'Missing Parameter');
      return;
    }
    try {
      await PurchaseOffer.findByIdAndUpdate(id, {
        status: 2,
        send_qc_time: Date.now(),
      }).then(data => {
        sendResponse(res, 200, true, {}, "Offered item sent to qc successfully");
      })
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
}

exports.getQcQuanity = async (req, res) => {
  const { offerId, items, acceptedBy, project } = req.body;

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, 'Unauthorized');
  }

  if (!offerId || !acceptedBy || !items) {
    return sendResponse(res, 400, false, {}, 'Missing parameters');
  }

  try {
    const parsedItems = JSON.parse(items);
    const offerData = await PurchaseOffer.findById(offerId).populate('items.transactionId');

    if (!offerData) {
      return sendResponse(res, 404, false, {}, "Offer not found");
    }

    let imir_no = "1";
    const lastOffer = await PurchaseOffer.findOne({ deleted: false, imir_no: { $regex: `/${project}/` } }, {}, { sort: { createdAt: -1 } });
    if (lastOffer?.imir_no) {
      const split = lastOffer.imir_no.split('/');
      const lastOfferNo = parseInt(split[split.length - 1], 10);
      imir_no = isNaN(lastOfferNo) ? "1" : (lastOfferNo + 1).toString();
    }

    const gen_imir_no = TitleFormat.imirno.replace('/PROJECT/', `/${project}/`) + imir_no;

    const updatedItems = [];
    const rejectedItems = [];
    const itemsData = [];
    let hasPartialApproval = false;

    for (const item of parsedItems) {
      const transactedItem = offerData.items.find(i => i.transactionId?._id.toString() === item.transactionId);

      if (!transactedItem) {
        return sendResponse(res, 400, false, {}, "Invalid transaction ID");
      }

      if (item.acceptedQty < 0) {
        return sendResponse(res, 400, false, {}, "Accepted quantity must be greater than or equal to zero");
      }

      if (item.acceptedQty > transactedItem.offeredQty) {
        return sendResponse(res, 400, false, {}, "Accepted quantity cannot exceed offered quantity");
      }

      const rejectedQty = transactedItem.offeredQty - item.acceptedQty;

      let qcStatus = 1;
      if (item.acceptedQty === transactedItem.offeredQty) {
        qcStatus = 4;
      } else if (item.acceptedQty > 0 && rejectedQty > 0) {
        qcStatus = 2;
        hasPartialApproval = true;
      } else if (rejectedQty === transactedItem.offeredQty) {
        qcStatus = 3;
      }

      // Update item details
      const updatedItem = {
        ...transactedItem.toObject(),
        acceptedQty: item.acceptedQty,
        rejectedQty: item.rejectedQty,
        acceptedNos: item.acceptedNos,
        acceptedLength: item.acceptedLength,
        acceptedWidth: item.acceptedWidth,
        accepted_topbottom_thickness: item.accepted_topbottom_thickness,
        accepted_width_thickness: item.accepted_width_thickness,
        accepted_normal_thickness: item.accepted_normal_thickness,
        accepted_lot_no: item.accepted_lot_no,
        tcNo: item.tcNo,
        heat_no_data: item.heat_no_data,
        challan_qty: item.challan_qty,
        rejected_length: item.rejected_length,
        rejected_width: item.rejected_width,
        balance_qty: parseInt(item.acceptedQty),
        qcStatus,
        acceptedRemarks: item.acceptedRemarks || '',
        manufacture: item.manufacture,
      };
      updatedItems.push(updatedItem);

      // Prepare rejected items
      if (item.rejectedQty > 0) {
        itemsData.push({
          transactionId: item.transactionId,
          offeredQty: rejectedQty,
          qcStatus: 3, // Rejected status
        });
      }
    }

    // Update main offer
    const updateData = {
      imir_no: gen_imir_no,
      acceptedBy,
      offeredBy: offerData.offeredBy,
      items: updatedItems,
      status: hasPartialApproval ? 5 : itemsData.length > 0 ? 4 : 3,
      received_date: Date.now(),
    };

    // const updatedOffer = await PurchaseOffer.findByIdAndUpdate(offerId, updateData, { new: true });
    await PurchaseOffer.findByIdAndUpdate(offerId, updateData, { new: true }).then(async data => {
      if (data) {
        const existStock = await ItemStock.findOne({ requestId: offerData.requestId, deleted: false });
        if (existStock) {
          existStock.offerList.push({ offerId });
          await existStock.save();
        } else {
          const newStock = new ItemStock({
            requestId: offerData?.requestId,
            offerList: [{ offerId }],
          });
          await newStock.save();
        }

        const reqStatus = await updateRequestStatus(offerId);
        if (reqStatus) {
          const requestData = await requestModel.findById(offerData?.requestId);
          if (requestData) {
            requestData.status = 4;
            await requestData.save();
          }
        }

        return sendResponse(res, 200, true, {}, "QC details updated successfully");
      } else {
        sendResponse(res, 400, false, {}, 'Something went wrong');
        return;
      }
    }).catch(err => {
      console.error(err);
      return sendResponse(res, 500, false, {}, `Error: ${err.message}`);
    });



    // Handle rejected items if any
    // if (itemsData.length > 0) {
    //   const regeneratedOffer = {
    //     offer_no: `${offerData.offer_no.split('/').slice(0, -1).join('/')}/${parseInt(offerData.offer_no.split('/').pop()) + 1}`,
    //     requestId: offerData.requestId,
    //     items: itemsData,
    //     status: 3, 
    //   };

    //   await PurchaseOffer.create(regeneratedOffer);
    // }


  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, false, {}, `Error: ${err.message}`);
  }
};

exports.managePurchaseOffer = async (req, res) => {
  const { id, requestId, items, received_date, offeredBy, project, invoice_no } = req.body;
  console.log("req", req.body);
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

    console.log("================================");
  console.log("Request _ID",requestId);
  console.log("================================");
  console.log("items",items);
  console.log("================================");
  console.log("received_date",received_date);
  console.log("================================");
  console.log("offeredBy",offeredBy);
  console.log("================================");
  console.log("project",project);
  console.log("================================");
  console.log("invocerid",    invoice_no);


  if (!requestId || !offeredBy) {
    return sendResponse(res, 400, false, {}, "Missing parameter");
  }

  try {
    const itemVal = items ? JSON.parse(items) : [];
    let offerNo = "1";

    // const lastOffer = await PurchaseOffer.findOne({ deleted: false }, {}, { sort: { createdAt: -1 } });  
    const lastOffer = await PurchaseOffer.findOne({ deleted: false, offer_no: { $regex: `/${project}/` } }, {}, { sort: { createdAt: -1 } });
    if (lastOffer?.offer_no) {
      const split = lastOffer.offer_no.split('/');
      const lastOfferNo = parseInt(split[split.length - 1], 10);
      offerNo = isNaN(lastOfferNo) ? "1" : (lastOfferNo + 1).toString();
    }

    const gen_offer_no = TitleFormat.materialOfferNo.replace('/PROJECT/', `/${project}/`) + offerNo;

    if (!id) {
      const newOffer = new PurchaseOffer({
        offer_no: gen_offer_no,
        requestId,
        items: itemVal,
        received_date,
        offeredBy,
        invoice_no,
      });

      let allZero = true;

      for (const item of itemVal) {
        const transactionItem = await TransactionItems.findById(item?.transactionId);
        if (!transactionItem) continue;

        transactionItem.balance_qty -= item?.offeredQty;
        if (transactionItem.balance_qty < 0) transactionItem.balance_qty = 0;

        await transactionItem.save();

        if (transactionItem.balance_qty > 0) {
          allZero = false;
        }

        item.rejectedQty = 0;
      }

      const relatedItems = await TransactionItems.find({ requestId });
      allZero = relatedItems.every(item => item.balance_qty === 0);

      if (allZero) {
        await requestModel.findByIdAndUpdate(requestId, { status: 5 });
      }

      await newOffer.save();
      return sendResponse(res, 200, true, {}, "Purchase offer submitted successfully");
    } else {

      await PurchaseOffer.findByIdAndUpdate(id, {
        requestId,
        items: itemVal,
        received_date,
        offeredBy,
        invoice_no,
      });

      const relatedItems = await TransactionItems.find({ requestId });
      const allItemsZeroBalance = relatedItems.every(item => item.balance_qty === 0);
console.log("relatedItems", relatedItems);
console.log("allItemsZeroBalance", allItemsZeroBalance);
      if (allItemsZeroBalance) {
        await requestModel.findByIdAndUpdate(requestId, { status: 5 });
      }

      return sendResponse(res, 200, true, {}, "Purchase offer updated successfully");
    }
  } catch (err) {
    console.error("Error in managePurchaseOffer:", err);
    return sendResponse(res, 500, false, {}, "Something went wrong");
  }
};




// exports.managePurchaseOffer = async (req, res) => {
//   const { id, requestId, items, received_date, offeredBy, project, invoice_no } = req.body;
//   console.log("Incoming Request Body:", req.body);

//   if (!req.user || req.error) {
//     return sendResponse(res, 401, false, {}, "Unauthorized");
//   }

//   if (!requestId || !offeredBy) {
//     return sendResponse(res, 400, false, {}, "Missing parameter");
//   }

//   try {
//     const itemVal = items ? JSON.parse(items) : [];
//     let offerNo = "1";

//     if (!id) {
//       // ============ CREATE OFFER ============

//       const lastOffer = await PurchaseOffer.findOne(
//         { deleted: false, offer_no: { $regex: `/${project}/` } },
//         {},
//         { sort: { createdAt: -1 } }
//       );

//       if (lastOffer?.offer_no) {
//         const split = lastOffer.offer_no.split('/');
//         const lastOfferNo = parseInt(split[split.length - 1], 10);
//         offerNo = isNaN(lastOfferNo) ? "1" : (lastOfferNo + 1).toString();
//       }

//       const gen_offer_no = TitleFormat.materialOfferNo.replace('/PROJECT/', `/${project}/`) + offerNo;

//       const newOffer = new PurchaseOffer({
//         offer_no: gen_offer_no,
//         requestId,
//         items: itemVal,
//         received_date,
//         offeredBy,
//         invoice_no,
//       });

//       let allZero = true;

//       for (const item of itemVal) {
//         const transactionItem = await TransactionItems.findById(item?.transactionId);
//         if (!transactionItem) continue;

//         transactionItem.balance_qty -= Number(item?.offeredQty || 0);
//         if (transactionItem.balance_qty < 0) transactionItem.balance_qty = 0;

//         await transactionItem.save();

//         if (transactionItem.balance_qty > 0) {
//           allZero = false;
//         }

//         item.rejectedQty = 0;
//       }

//       const relatedItems = await TransactionItems.find({ requestId });
//       allZero = relatedItems.every(item => item.balance_qty === 0);
//       if (allZero) {
//         await requestModel.findByIdAndUpdate(requestId, { status: 5 });
//       }

//       await newOffer.save();
//       return sendResponse(res, 200, true, {}, "Purchase offer submitted successfully");

//     } else {
//       // ============ UPDATE OFFER ============

//       const existingOffer = await PurchaseOffer.findById(id);
//       if (!existingOffer) {
//         return sendResponse(res, 404, false, {}, "Offer not found");
//       }

//       // First, rollback balance_qty using previous offeredQty
//       for (const prevItem of existingOffer.items) {
//         const transactionItem = await TransactionItems.findById(prevItem?.transactionId);
//         if (transactionItem) {
//           transactionItem.balance_qty += Number(prevItem?.offeredQty || 0);
//           await transactionItem.save();
//         }
//       }

//       // Then, apply new offeredQty
//       for (const item of itemVal) {
//         const transactionItem = await TransactionItems.findById(item?.transactionId);
//         if (transactionItem) {
//           transactionItem.balance_qty -= Number(item?.offeredQty || 0);
//           if (transactionItem.balance_qty < 0) transactionItem.balance_qty = 0;
//           await transactionItem.save();
//         }
//         item.rejectedQty = 0;
//       }

//       // Save the updated offer
//       await PurchaseOffer.findByIdAndUpdate(id, {
//         requestId,
//         items: itemVal,
//         received_date,
//         offeredBy,
//         invoice_no,
//       });

//       // Check if all transaction items are fulfilled
//       const relatedItems = await TransactionItems.find({ requestId });
//       const allItemsZeroBalance = relatedItems.every(item => item.balance_qty === 0);
//       if (allItemsZeroBalance) {
//         await requestModel.findByIdAndUpdate(requestId, { status: 5 });
//       }

//       return sendResponse(res, 200, true, {}, "Purchase offer updated successfully");
//     }
//   } catch (err) {
//     console.error("Error in managePurchaseOffer:", err);
//     return sendResponse(res, 500, false, {}, "Something went wrong");
//   }
// };

exports.deletePurchaseOffer = async (req, res) => {
  const { id } = req.body;
  try {
    const deletedOffer = await PurchaseOffer.findByIdAndUpdate(id, {
      deleted: true,
    });
    if (deletedOffer) {
      sendResponse(res, 200, true, {}, "Purchase offer deleted successfully");
    } else {
      sendResponse(res, 404, false, {}, "offer not found");
    }
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

const calculateStatus = offer => {
  let approvedCount = 0;
  let partiallyApproved = false;

  for (let item of offer.items) {
    const { acceptedQty, rejectedQty, offeredQty } = item;

    if (acceptedQty + rejectedQty === offeredQty) {
      if (rejectedQty > 0 && acceptedQty > 0) {
        partiallyApproved = true;
      } else if (rejectedQty === 0) {
        approvedCount++;
      }
    }
  }

  if (approvedCount === offer.items.length) return 3; // Fully Approved
  if (partiallyApproved) return 2; // Partially Approved
  return 4; // Rejected
};

const updateRequestStatus = async (offerId) => {
  const offerData = await PurchaseOffer.findById(offerId);
  const requestID = offerData.requestId;

  if (requestID) {
    const allPurchaseOffers = await PurchaseOffer.find({ requestId: requestID, $or: [{ status: 3 }, { status: 4 }] });
    const requestedItems = await transaction_itemModel.find({ requestId: requestID });

    let originalQty = [];
    for (let item of requestedItems) {
      let obj = {
        transactionId: item._id,
        qty: item.quantity,
      }
      originalQty.push(obj);
    }

    const result = [];

    for (let item of requestedItems) {
      let totalItemAccepted = 0;

      for (let offer of allPurchaseOffers) {
        let matchingItem = offer.items.find(o => o.transactionId.toString() === item._id.toString());

        if (matchingItem) {
          totalItemAccepted += parseInt(matchingItem.acceptedQty) || 0;
        }
      }

      result.push({
        transactionId: item._id,
        qty: totalItemAccepted
      });
    }
    return JSON.stringify(originalQty) === JSON.stringify(result);
  }
};
         
