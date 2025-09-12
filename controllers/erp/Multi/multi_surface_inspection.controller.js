const { sendResponse } = require("../../../helper/response");
const SurfaceInspection = require("../../../models/erp/Multi/multi_surface_inspection.model");
const SurfaceOfferTable = require("../../../models/erp/Multi/offer_table_data/Paint/surface_offer_table.model");
const { TitleFormat } = require("../../../utils/enum");
const { default: mongoose } = require("mongoose");
const {
  Types: { ObjectId },
} = require("mongoose");
const DispatchNote = require("../../../models/erp/Multi/dispatch_note/multi_dispatch_note.model");
const {
  generatePDF,
  generatePDFA4,
  generatePDFA4WithoutPrintDate,
} = require("../../../utils/pdfUtils");
const ejs = require("ejs");
const fs = require("fs");
const XLSX = require("xlsx"); // for utility functions
const XLSXStyle = require("xlsx-style"); // for styling
const puppeteer = require("puppeteer");
const path = require("path");
const URI = process.env.PDF_URL;
const PATH = process.env.PDF_PATH;
// const { addReleaseNote } = require("../../release_note/multi_release_note.controller");
const { addSurfaceReleaseNote} = require("../../../controllers/erp/Multi/release_note/multi_release_note.controller");

exports.generateSurfaceOffer = async (req, res) => {
  const {
    procedure_no,
    weather_condition,
    original_status,
    metal_condition,
    metal_rust_grade,
    paint_system_id,
    blasting_date,
    blasting_method,
    abrasive_type,
    dust_level,
    primer_date,
    time,
    paint_batch_base,
    manufacture_date,
    shelf_life,
    paint_batch_hardner,
    items,
    offered_by,
    offer_notes,
    start_time,
    end_time,
    project,
  } = req.body;

const isIrn = req.body.isIrn === 'true' || req.body.isIrn === true;
const isSurface = req.body.isSurface === 'true' || req.body.isSurface === true;
console.log("isSurface:", isSurface);
  const itemArray = JSON.parse(items);
  const weatherCondition =
    typeof weather_condition !== "undefined" && weather_condition !== null
      ? JSON.parse(weather_condition)
      : [];
  // const itemArray = items;
  // const weatherCondition = weather_condition.length > 0 ? weather_condition : [];

  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  if (
    !paint_system_id ||
    !procedure_no ||
    !offered_by ||
    !project ||
    itemArray.length === 0
  ) {
    sendResponse(res, 400, false, {}, "Missing parameters!");
  }

  try {
    let lastOffer = await SurfaceInspection.findOne(
      { deleted: false, report_no: { $regex: `/${project}/` } },
      { deleted: 0 },
      { sort: { createdAt: -1 } }
    );
    let newOfferNo = "1";
    if (lastOffer && lastOffer.report_no) {
      const split = lastOffer.report_no.split("/");
      const lastOfferNo = parseInt(split[split.length - 1]);
      newOfferNo = lastOfferNo + 1;
    }
    const gen_voucher_no =
      TitleFormat.SURFACEOFFERNO.replace("/PROJECT/", `/${project}/`) +
      newOfferNo;

    const addSurfaceIoffer = await SurfaceInspection.create({
      report_no: gen_voucher_no,
      offer_date: Date.now(),
      weather_condition: weatherCondition,
      procedure_no,
      original_status,
      metal_condition,
      metal_rust_grade,
      paint_system_id,
      blasting_date,
      blasting_method,
      abrasive_type,
      dust_level,
      primer_date,
      time,
      paint_batch_base,
      manufacture_date,
      shelf_life,
      paint_batch_hardner,
      offered_by,
      offer_notes,
      start_time,
      end_time,
      isIrn,
      isSurface,
      items: itemArray,
    });

    if (addSurfaceIoffer) {
      for (const item of itemArray) {
        const { surface_offer_id } = item;
        const deleteSurfaceOffer = await SurfaceOfferTable.deleteOne({
          _id: new ObjectId(surface_offer_id),
        });
      }
      sendResponse(
        res,
        200,
        true,
        addSurfaceIoffer,
        "Surface/Primer Paint added successfully"
      );
    } else {
      sendResponse(res, 400, false, {}, "Surface/Primer Paint not added");
    }
  } catch (error) {
    sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

exports.getMultiSurfaceInspectionOffer = async (req, res) => {
  const { project_id, paint_system_id, report_no, dispatch_site, is_accepted } =
    req.body;

    console.log("req.body:", req.body);
  if (req.user && !req.error) {
    try {
      let matchObj = {};

      if (paint_system_id) {
        matchObj["paintDetails._id"] = new ObjectId(paint_system_id);
      }

      if (report_no) {
        matchObj["dispatchDetails.report_no"] = report_no;
      }

      if (dispatch_site) {
        matchObj["dispatchDetails.dispatch_site"] = dispatch_site;
      }

      if (is_accepted) {
        let acce = JSON.parse(is_accepted);
        matchObj["items.is_accepted"] = acce;
      }

      let requestData = await SurfaceInspection.aggregate([
        { $match: { deleted: false } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "erp-planner-drawings",
            localField: "items.drawing_id",
            foreignField: "_id",
            as: "drawingDetails",
            pipeline: [
              {
                $lookup: {
                  from: "bussiness-projects",
                  localField: "project",
                  foreignField: "_id",
                  as: "projectDetails",
                  pipeline: [
                    {
                      $lookup: {
                        from: "store-parties",
                        localField: "party",
                        foreignField: "_id",
                        as: "clientDetails",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "erp-drawing-grids",
            localField: "items.grid_id",
            foreignField: "_id",
            as: "gridDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "offered_by",
            foreignField: "_id",
            as: "offerDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "qc_name",
            foreignField: "_id",
            as: "qcDetails",
          },
        },
        {
          $lookup: {
            from: "procedure_and_specifications",
            localField: "procedure_no",
            foreignField: "_id",
            as: "procedureDetails",
          },
        },
        {
          $lookup: {
            from: "painting-systems",
            localField: "paint_system_id",
            foreignField: "_id",
            as: "paintDetails",
          },
        },
        {
          $lookup: {
            from: "multi-erp-painting-dispatch-notes",
            localField: "items.main_id",
            foreignField: "_id",
            as: "dispatchDetails",
          },
        },
     
        {
          $addFields: {
            drawingDetails: { $arrayElemAt: ["$drawingDetails", 0] },
            gridDetails: { $arrayElemAt: ["$gridDetails", 0] },
            offerDetails: { $arrayElemAt: ["$offerDetails", 0] },
            qcDetails: { $arrayElemAt: ["$qcDetails", 0] },
            procedureDetails: { $arrayElemAt: ["$procedureDetails", 0] },
            paintDetails: { $arrayElemAt: ["$paintDetails", 0] },
            dispatchDetails: { $arrayElemAt: ["$dispatchDetails", 0] },
          },
        },
        {
          $addFields: {
            projectDetails: {
              $arrayElemAt: ["$drawingDetails.projectDetails", 0],
            },
          },
        },
        {
          $addFields: {
            clientDetails: {
              $arrayElemAt: ["$projectDetails.clientDetails", 0],
            },
          },
        },

        {
          $match: { "projectDetails._id": new ObjectId(project_id) },
        },
        {
          $match: matchObj,
        },
        {
          $project: {
            _id: 1,
            report_no: "$report_no",
            report_no_two: "$report_no_two",
            weather_condition: "$weather_condition",
            procedure_id: "$procedureDetails._id",
            procedure_no: "$procedureDetails.vendor_doc_no",
            offer_date: "$offer_date",
            offer_name: "$offerDetails.user_name",
            qc_date: "$qc_date",
            qc_name: "$qcDetails.user_name",
            original_status: "$original_status",
            metal_condition: "$metal_condition",
            metal_rust_grade: "$metal_rust_grade",
            paint_system_no: "$paintDetails.paint_system_no",
            paint_system_id: "$paintDetails._id",
            blasting_date: "$blasting_date",
            blasting_method: "$blasting_method",
            abrasive_type: "$abrasive_type",
            dust_level: "$dust_level",
            primer_date: "$primer_date",
            time: "$time",
            paint_batch_base: "$paint_batch_base",
            manufacture_date: "$manufacture_date",
            shelf_life: "$shelf_life",
            paint_batch_hardner: "$paint_batch_hardner",
            actual_surface_profile: "$actual_surface_profile",
            salt_test_reading: "$salt_test_reading",
            offer_notes: "$offer_notes",
            qc_notes: "$qc_notes",
            status: "$status",
            start_time: "$start_time",
            end_time: "$end_time",
            client: "$clientDetails.name",
            project_name: "$projectDetails.name",
            wo_no: "$projectDetails.work_order_no",
            project_po_no: "$projectDetails.work_order_no",
            createdAt: 1,
            items: {
              _id: "$items._id",
              main_id: "$_id",
              drawing_id: "$drawingDetails._id",
              drawing_no: "$drawingDetails.drawing_no",
              rev: "$drawingDetails.rev",
              sheet_no: "$drawingDetails.sheet_no",
              assembly_no: "$drawingDetails.assembly_no",
              assembly_quantity: "$drawingDetails.assembly_quantity",
              grid_id: "$gridDetails._id",
              grid_no: "$gridDetails.grid_no",
              grid_qty: "$gridDetails.grid_qty",
              dispatch_id: "$dispatchDetails._id",
              dispatch_report: "$dispatchDetails.report_no",
              dispatch_site: "$dispatchDetails.dispatch_site",
              isSurface: "$dispatchDetails.isSurface",
              isMio: "$dispatchDetails.isMio",
              isFp: "$dispatchDetails.isFp",
              isIrn: "$dispatchDetails.isIrn",
              surface_balance_grid_qty: "$items.surface_balance_grid_qty",
              surface_used_grid_qty: "$items.surface_used_grid_qty",
              moved_next_step: "$items.moved_next_step",
              average_dft_primer: "$items.average_dft_primer",
              is_accepted: "$items.is_accepted",
              remarks: "$items.remarks",
            },
          },
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              report_no: "$report_no",
              report_no_two: "$report_no_two",
              weather_condition: "$weather_condition",
              procedure_id: "$procedure_id",
              procedure_no: "$procedure_no",
              offer_date: "$offer_date",
              offer_name: "$offer_name",
              qc_date: "$qc_date",
              qc_name: "$qc_name",
              original_status: "$original_status",
              metal_condition: "$metal_condition",
              metal_rust_grade: "$metal_rust_grade",
              paint_system_no: "$paint_system_no",
              paint_system_id: "$paint_system_id",
              blasting_date: "$blasting_date",
              blasting_method: "$blasting_method",
              abrasive_type: "$abrasive_type",
              dust_level: "$dust_level",
              primer_date: "$primer_date",
              time: "$time",
              paint_batch_base: "$paint_batch_base",
              manufacture_date: "$manufacture_date",
              shelf_life: "$shelf_life",
              paint_batch_hardner: "$paint_batch_hardner",
              actual_surface_profile: "$actual_surface_profile",
              salt_test_reading: "$salt_test_reading",
              offer_notes: "$offer_notes",
              qc_notes: "$qc_notes",
              status: "$status",
              start_time: "$start_time",
              end_time: "$end_time",
              status: "$status",
              client: "$client",
              project_name: "$project_name",
              wo_no: "$wo_no",
              project_po_no: "$project_po_no",
              createdAt: "$createdAt",
            },
            items: { $push: "$items" },
          },
        },
        {
          $project: {
            _id: "$_id._id",
            report_no: "$_id.report_no",
            report_no_two: "$_id.report_no_two",
            weather_condition: "$_id.weather_condition",
            procedure_id: "$_id.procedure_id",
            procedure_no: "$_id.procedure_no",
            offer_date: "$_id.offer_date",
            offer_name: "$_id.offer_name",
            qc_date: "$_id.qc_date",
            qc_name: "$_id.qc_name",
            original_status: "$_id.original_status",
            metal_condition: "$_id.metal_condition",
            metal_rust_grade: "$_id.metal_rust_grade",
            paint_system_no: "$_id.paint_system_no",
            paint_system_id: "$_id.paint_system_id",
            blasting_date: "$_id.blasting_date",
            blasting_method: "$_id.blasting_method",
            abrasive_type: "$_id.abrasive_type",
            dust_level: "$_id.dust_level",
            primer_date: "$_id.primer_date",
            time: "$_id.time",
            paint_batch_base: "$_id.paint_batch_base",
            manufacture_date: "$_id.manufacture_date",
            shelf_life: "$_id.shelf_life",
            paint_batch_hardner: "$_id.paint_batch_hardner",
            actual_surface_profile: "$_id.actual_surface_profile",
            salt_test_reading: "$_id.salt_test_reading",
            offer_notes: "$_id.offer_notes",
            qc_notes: "$_id.qc_notes",
            start_time: "$_id.start_time",
            end_time: "$_id.end_time",
            status: "$_id.status",
            client: "$_id.client",
            project_name: "$_id.project_name",
            wo_no: "$_id.wo_no",
            project_po_no: "$_id.project_po_no",
            items: 1,
            createdAt: "$_id.createdAt",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      if (requestData.length && requestData.length > 0) {
        sendResponse(res, 200, true, requestData, `Surface data list`);
      } else {
        sendResponse(res, 200, true, [], `Surface data not found`);
      }
    } catch (error) {
        console.log("Error in getMultiSurfaceInspectionOffer:", error);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};


// exports.getMultiSurfaceInspectionOffer = async (req, res) => {
//   const { project_id, paint_system_id, report_no, dispatch_site, is_accepted, page,limit } =
//     req.body;

//     console.log("req.body:", req.body);
//   if (req.user && !req.error) {
//     try {
//       let matchObj = {};

//       if (paint_system_id) {
//         matchObj["paintDetails._id"] = new ObjectId(paint_system_id);
//       }

//       if (report_no) {
//         matchObj["dispatchDetails.report_no"] = report_no;
//       }

//       if (dispatch_site) {
//         matchObj["dispatchDetails.dispatch_site"] = dispatch_site;
//       }

//       if (is_accepted) {
//         let acce = JSON.parse(is_accepted);
//         matchObj["items.is_accepted"] = acce;
//       }
// const pageNumber = parseInt(page) || 1;
// const pageSize = parseInt(limit) || 10;
// const skip = (pageNumber - 1) * pageSize;

//       let requestData = await SurfaceInspection.aggregate([
//         { $match: { deleted: false } },
//         { $unwind: "$items" },
//         {
//           $lookup: {
//             from: "erp-planner-drawings",
//             localField: "items.drawing_id",
//             foreignField: "_id",
//             as: "drawingDetails",
//             pipeline: [
//               {
//                 $lookup: {
//                   from: "bussiness-projects",
//                   localField: "project",
//                   foreignField: "_id",
//                   as: "projectDetails",
//                   pipeline: [
//                     {
//                       $lookup: {
//                         from: "store-parties",
//                         localField: "party",
//                         foreignField: "_id",
//                         as: "clientDetails",
//                       },
//                     },
//                   ],
//                 },
//               },
//             ],
//           },
//         },
//         {
//           $lookup: {
//             from: "erp-drawing-grids",
//             localField: "items.grid_id",
//             foreignField: "_id",
//             as: "gridDetails",
//           },
//         },
//         {
//           $lookup: {
//             from: "users",
//             localField: "offered_by",
//             foreignField: "_id",
//             as: "offerDetails",
//           },
//         },
//         {
//           $lookup: {
//             from: "users",
//             localField: "qc_name",
//             foreignField: "_id",
//             as: "qcDetails",
//           },
//         },
//         {
//           $lookup: {
//             from: "procedure_and_specifications",
//             localField: "procedure_no",
//             foreignField: "_id",
//             as: "procedureDetails",
//           },
//         },
//         {
//           $lookup: {
//             from: "painting-systems",
//             localField: "paint_system_id",
//             foreignField: "_id",
//             as: "paintDetails",
//           },
//         },
//         {
//           $lookup: {
//             from: "multi-erp-painting-dispatch-notes",
//             localField: "items.main_id",
//             foreignField: "_id",
//             as: "dispatchDetails",
//           },
//         },
     
//         {
//           $addFields: {
//             drawingDetails: { $arrayElemAt: ["$drawingDetails", 0] },
//             gridDetails: { $arrayElemAt: ["$gridDetails", 0] },
//             offerDetails: { $arrayElemAt: ["$offerDetails", 0] },
//             qcDetails: { $arrayElemAt: ["$qcDetails", 0] },
//             procedureDetails: { $arrayElemAt: ["$procedureDetails", 0] },
//             paintDetails: { $arrayElemAt: ["$paintDetails", 0] },
//             dispatchDetails: { $arrayElemAt: ["$dispatchDetails", 0] },
//           },
//         },
//         {
//           $addFields: {
//             projectDetails: {
//               $arrayElemAt: ["$drawingDetails.projectDetails", 0],
//             },
//           },
//         },
//         {
//           $addFields: {
//             clientDetails: {
//               $arrayElemAt: ["$projectDetails.clientDetails", 0],
//             },
//           },
//         },

//         {
//           $match: { "projectDetails._id": new ObjectId(project_id) },
//         },
//         {
//           $match: matchObj,
//         },
//         {
//           $project: {
//             _id: 1,
//             report_no: "$report_no",
//             report_no_two: "$report_no_two",
//             weather_condition: "$weather_condition",
//             procedure_id: "$procedureDetails._id",
//             procedure_no: "$procedureDetails.vendor_doc_no",
//             offer_date: "$offer_date",
//             offer_name: "$offerDetails.user_name",
//             qc_date: "$qc_date",
//             qc_name: "$qcDetails.user_name",
//             original_status: "$original_status",
//             metal_condition: "$metal_condition",
//             metal_rust_grade: "$metal_rust_grade",
//             paint_system_no: "$paintDetails.paint_system_no",
//             paint_system_id: "$paintDetails._id",
//             blasting_date: "$blasting_date",
//             blasting_method: "$blasting_method",
//             abrasive_type: "$abrasive_type",
//             dust_level: "$dust_level",
//             primer_date: "$primer_date",
//             time: "$time",
//             paint_batch_base: "$paint_batch_base",
//             manufacture_date: "$manufacture_date",
//             shelf_life: "$shelf_life",
//             paint_batch_hardner: "$paint_batch_hardner",
//             actual_surface_profile: "$actual_surface_profile",
//             salt_test_reading: "$salt_test_reading",
//             offer_notes: "$offer_notes",
//             qc_notes: "$qc_notes",
//             status: "$status",
//             start_time: "$start_time",
//             end_time: "$end_time",
//             client: "$clientDetails.name",
//             project_name: "$projectDetails.name",
//             wo_no: "$projectDetails.work_order_no",
//             project_po_no: "$projectDetails.work_order_no",
//             createdAt: 1,
//             items: {
//               _id: "$items._id",
//               main_id: "$_id",
//               drawing_id: "$drawingDetails._id",
//               drawing_no: "$drawingDetails.drawing_no",
//               rev: "$drawingDetails.rev",
//               sheet_no: "$drawingDetails.sheet_no",
//               assembly_no: "$drawingDetails.assembly_no",
//               assembly_quantity: "$drawingDetails.assembly_quantity",
//               grid_id: "$gridDetails._id",
//               grid_no: "$gridDetails.grid_no",
//               grid_qty: "$gridDetails.grid_qty",
//               dispatch_id: "$dispatchDetails._id",
//               dispatch_report: "$dispatchDetails.report_no",
//               dispatch_site: "$dispatchDetails.dispatch_site",
//               isSurface: "$dispatchDetails.isSurface",
//               isMio: "$dispatchDetails.isMio",
//               isFp: "$dispatchDetails.isFp",
//               isIrn: "$dispatchDetails.isIrn",
//               surface_balance_grid_qty: "$items.surface_balance_grid_qty",
//               surface_used_grid_qty: "$items.surface_used_grid_qty",
//               moved_next_step: "$items.moved_next_step",
//               average_dft_primer: "$items.average_dft_primer",
//               is_accepted: "$items.is_accepted",
//               remarks: "$items.remarks",
//             },
//           },
//         },
//         {
//           $group: {
//             _id: {
//               _id: "$_id",
//               report_no: "$report_no",
//               report_no_two: "$report_no_two",
//               weather_condition: "$weather_condition",
//               procedure_id: "$procedure_id",
//               procedure_no: "$procedure_no",
//               offer_date: "$offer_date",
//               offer_name: "$offer_name",
//               qc_date: "$qc_date",
//               qc_name: "$qc_name",
//               original_status: "$original_status",
//               metal_condition: "$metal_condition",
//               metal_rust_grade: "$metal_rust_grade",
//               paint_system_no: "$paint_system_no",
//               paint_system_id: "$paint_system_id",
//               blasting_date: "$blasting_date",
//               blasting_method: "$blasting_method",
//               abrasive_type: "$abrasive_type",
//               dust_level: "$dust_level",
//               primer_date: "$primer_date",
//               time: "$time",
//               paint_batch_base: "$paint_batch_base",
//               manufacture_date: "$manufacture_date",
//               shelf_life: "$shelf_life",
//               paint_batch_hardner: "$paint_batch_hardner",
//               actual_surface_profile: "$actual_surface_profile",
//               salt_test_reading: "$salt_test_reading",
//               offer_notes: "$offer_notes",
//               qc_notes: "$qc_notes",
//               status: "$status",
//               start_time: "$start_time",
//               end_time: "$end_time",
//               status: "$status",
//               client: "$client",
//               project_name: "$project_name",
//               wo_no: "$wo_no",
//               project_po_no: "$project_po_no",
//               createdAt: "$createdAt",
//             },
//             items: { $push: "$items" },
//           },
//         },
//         {
//           $project: {
//             _id: "$_id._id",
//             report_no: "$_id.report_no",
//             report_no_two: "$_id.report_no_two",
//             weather_condition: "$_id.weather_condition",
//             procedure_id: "$_id.procedure_id",
//             procedure_no: "$_id.procedure_no",
//             offer_date: "$_id.offer_date",
//             offer_name: "$_id.offer_name",
//             qc_date: "$_id.qc_date",
//             qc_name: "$_id.qc_name",
//             original_status: "$_id.original_status",
//             metal_condition: "$_id.metal_condition",
//             metal_rust_grade: "$_id.metal_rust_grade",
//             paint_system_no: "$_id.paint_system_no",
//             paint_system_id: "$_id.paint_system_id",
//             blasting_date: "$_id.blasting_date",
//             blasting_method: "$_id.blasting_method",
//             abrasive_type: "$_id.abrasive_type",
//             dust_level: "$_id.dust_level",
//             primer_date: "$_id.primer_date",
//             time: "$_id.time",
//             paint_batch_base: "$_id.paint_batch_base",
//             manufacture_date: "$_id.manufacture_date",
//             shelf_life: "$_id.shelf_life",
//             paint_batch_hardner: "$_id.paint_batch_hardner",
//             actual_surface_profile: "$_id.actual_surface_profile",
//             salt_test_reading: "$_id.salt_test_reading",
//             offer_notes: "$_id.offer_notes",
//             qc_notes: "$_id.qc_notes",
//             start_time: "$_id.start_time",
//             end_time: "$_id.end_time",
//             status: "$_id.status",
//             client: "$_id.client",
//             project_name: "$_id.project_name",
//             wo_no: "$_id.wo_no",
//             project_po_no: "$_id.project_po_no",
//             items: 1,
//             createdAt: "$_id.createdAt",
//           },
//         },
//         // {
//         //   $sort: { createdAt: -1 },
//         // },

//         {
//   $facet: {
//     data: [
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: pageSize }
//     ],
//     totalCount: [
//       { $count: "count" }
//     ]
//   }
// }
//       ]);

//       let paginatedResult = requestData[0] || {};
// let data = paginatedResult.data || [];
// let totalCount = paginatedResult.totalCount[0]?.count || 0;

// sendResponse(res, 200, true, {
//   data,
//   totalCount,
//   currentPage: pageNumber,
//   totalPages: Math.ceil(totalCount / pageSize),
// }, data.length ? "Surface data list" : "Surface data not found");

//       // if (requestData.length && requestData.length > 0) {
//       //   sendResponse(res, 200, true, requestData, `Surface data list`);
//       // } else {
//       //   sendResponse(res, 200, true, [], `Surface data not found`);
//       // }
//     } catch (error) {
//         console.log("Error in getMultiSurfaceInspectionOffer:", error);
//       sendResponse(res, 500, false, {}, "Something went wrong");
//     }
//   } else {
//     sendResponse(res, 401, false, {}, "Unauthorized");
//   }
// };



async function getLastInspection(project) {
  try {
    const pipeline = [
      {
        $match: {
          deleted: false,
          report_no_two: {
            $regex: `^VE/${project}/STR/SP/\\d+$`,
            $options: "i",
          },
        },
      },
      {
        $addFields: {
          inspectionNumber: {
            $toInt: {
              $arrayElemAt: [{ $split: ["$report_no_two", "/"] }, -1],
            },
          },
        },
      },
      { $sort: { inspectionNumber: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 1,
          report_no_two: 1,
          createdAt: 1,
          inspectionNumber: 1,
        },
      },
    ];

    const [lastInspection] = await SurfaceInspection.aggregate(pipeline);
    // console.log('Aggregation result:', lastInspection);
    return lastInspection || null;
  } catch (error) {
    console.error("Error fetching last inspection:", error);
    throw error;
  }
}

exports.verifySurfaceQcDetails = async (req, res) => {
  console.log(" Api verifySurface");
  const {
    id,
    items,
    qc_name,
    project,
    actual_surface_profile,
    salt_test_reading,
    qc_notes,

  } = req.body;
  if (!req.user || req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  const itemArray = JSON.parse(items);
  

  if (!id || itemArray.length === 0 || !qc_name || !project) {
    return sendResponse(res, 400, false, {}, "Missing parameter");
  }

  try {
    const lastInspection = await getLastInspection(project);
    let inspectionNo = "1";
    if (lastInspection && lastInspection.report_no_two) {
      const split = lastInspection.report_no_two.split("/");
      const lastInspectionNo = parseInt(split[split.length - 1]);
      inspectionNo = lastInspectionNo + 1;
    }
    const gen_report_no =
      TitleFormat.SURFACEINSPECTNO.replace("/PROJECT/", `/${project}/`) +
      inspectionNo;

    let surfaceInspection = await SurfaceInspection.findById(id);

    if (!surfaceInspection) {
      return sendResponse(
        res,
        404,
        false,
        {},
        "Surface/paint inspection not found"
      );
    }

    let status = 1;
    if (itemArray.length > 0) {
      if (itemArray.every((item) => item.is_accepted === 2)) status = 3;
      else if (itemArray.every((item) => item.is_accepted === 3)) status = 4;
      else if (
        itemArray.some((item) => item.is_accepted === 2) &&
        itemArray.some((item) => item.is_accepted === 3)
      )
        status = 2;
    }

    const verifySurface = await SurfaceInspection.findByIdAndUpdate(
      { _id: id },
      {
        report_no_two: gen_report_no,
        qc_name: qc_name,
        qc_date: new Date(),
        actual_surface_profile: actual_surface_profile,
        salt_test_reading: salt_test_reading,
        qc_notes: qc_notes,
        status: status,
      },
      { new: true }
    );

    let matchedCount = 0;
    let modifiedCount = 0;

    for (const item of itemArray) {
      const { _id, average_dft_primer, is_accepted } = item;
      const result = await SurfaceInspection.updateOne(
        { _id: id, "items._id": _id },
        {
          $set: {
            "items.$.average_dft_primer": average_dft_primer,
            "items.$.is_accepted": is_accepted,
            // "items.$.surface_used_grid_qty": surface_used_grid_qty,
          },
        }
      );
      matchedCount += result.matchedCount;
      modifiedCount += result.modifiedCount;
    }

    if (
      verifySurface &&
      matchedCount === modifiedCount &&
      matchedCount === itemArray.length
    ) {
      for (const item of itemArray) {
        const {
          dispatch_id,
          drawing_id,
          grid_id,
          surface_used_grid_qty,
          is_accepted,
        } = item;

      if (is_accepted === 2) {
  console.log("surface::: is_accepted is 2, updating dispatch note");
console.log("itemArray:", itemArray[0]);
  console.log("surface_used_grid_qty:", surface_used_grid_qty);
  console.log("dispatch_id:", dispatch_id);
  console.log("drawing_id:", drawing_id);
  console.log("grid_id:", grid_id);
  if (
    (surfaceInspection.isIrn === "true" || surfaceInspection.isIrn === true) &&
    (surfaceInspection.isSurface === "true" || surfaceInspection.isSurface === true)
  ) {
    console.log("surfaceInspection.isIrn:", surfaceInspection.isIrn);
    console.log("surface::: isSurface & isIrn true, generating release note");
   const usedQty = Number(surface_used_grid_qty) || 0;
      const result = await DispatchNote.updateOne(
            {
              _id: dispatch_id,
              "items.drawing_id": drawing_id,
              "items.grid_id": grid_id,
            },
            {
              $inc: {
                "items.$.moved_next_step": -usedQty,
              },
            }
          );
            const modifiedItemArray = itemArray.map(item => ({
    ...item,
    fc_used_grid_qty: surface_used_grid_qty
  }));
console.log('modifiedItemArray:', modifiedItemArray);
console.log("fc_used_grid_qty:", surface_used_grid_qty);
    const release_note = await addSurfaceReleaseNote({
      itemArray: modifiedItemArray,
      id: result._id,
      isIrn: surfaceInspection.isIrn,
      isSurface: surfaceInspection.isSurface,
    });
    console.log("Surface:::::::::::::::::Release note added:", release_note);
   
  }
}

        else if (is_accepted === 3) {
          // ✅ Case 2: Accepted = 3 → Only Dispatch update
          console.log("surface::: is_accepted is 3, updating dispatch note");

          const result = await DispatchNote.updateOne(
            {
              _id: dispatch_id,
              "items.drawing_id": drawing_id,
              "items.grid_id": grid_id,
            },
            {
              $inc: {
                "items.$.moved_next_step": -surface_used_grid_qty,
              },
            }
          );

          console.log("Dispatch note update result:", result);
        }
        // else → do nothing
      }

      return sendResponse(
        res,
        200,
        true,
        {},
        "Surface/paint verified successfully"
      );
    } else {
      return sendResponse(res, 400, false, {}, "Surface/paint not verified");
    }
  } catch (error) {
    console.error("Error in verifySurfaceQcDetails:", error);
    sendResponse(res, 500, false, {}, "Something went wrong");
  }
};

const getSurfaceInspectionOfferFunction = async (report_no, report_no_two) => {
  try {
    let matchObj = { deleted: false };
    if (report_no) {
      matchObj = { ...matchObj, report_no: report_no };
    }
    if (report_no_two) {
      matchObj = { ...matchObj, report_no_two: report_no_two };
    }

    let requestData = await SurfaceInspection.aggregate([
      { $match: matchObj },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "erp-planner-drawings",
          localField: "items.drawing_id",
          foreignField: "_id",
          as: "drawingDetails",
          pipeline: [
            {
              $lookup: {
                from: "bussiness-projects",
                localField: "project",
                foreignField: "_id",
                as: "projectDetails",
                pipeline: [
                  {
                    $lookup: {
                      from: "store-parties",
                      localField: "party",
                      foreignField: "_id",
                      as: "clientDetails",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "erp-drawing-grids",
          localField: "items.grid_id",
          foreignField: "_id",
          as: "gridDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "offered_by",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "qc_name",
          foreignField: "_id",
          as: "qcDetails",
        },
      },
      {
        $lookup: {
          from: "procedure_and_specifications",
          localField: "procedure_no",
          foreignField: "_id",
          as: "procedureDetails",
        },
      },
      {
        $lookup: {
          from: "painting-systems",
          localField: "paint_system_id",
          foreignField: "_id",
          as: "paintDetails",
          pipeline: [
            {
              $lookup: {
                from: "paint-manufactures",
                localField: "paint_manufacturer",
                foreignField: "_id",
                as: "paintManDetails",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "multi-erp-painting-dispatch-notes",
          localField: "items.main_id",
          foreignField: "_id",
          as: "dispatchDetails",
        },
      },
      {
        $addFields: {
          drawingDetails: { $arrayElemAt: ["$drawingDetails", 0] },
          gridDetails: { $arrayElemAt: ["$gridDetails", 0] },
          offerDetails: { $arrayElemAt: ["$offerDetails", 0] },
          qcDetails: { $arrayElemAt: ["$qcDetails", 0] },
          procedureDetails: { $arrayElemAt: ["$procedureDetails", 0] },
          paintDetails: { $arrayElemAt: ["$paintDetails", 0] },
          dispatchDetails: { $arrayElemAt: ["$dispatchDetails", 0] },
        },
      },
      {
        $addFields: {
          projectDetails: {
            $arrayElemAt: ["$drawingDetails.projectDetails", 0],
          },
          paintManDetails: {
            $arrayElemAt: ["$paintDetails.paintManDetails", 0],
          },
        },
      },
      {
        $addFields: {
          clientDetails: {
            $arrayElemAt: ["$projectDetails.clientDetails", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          report_no: report_no ? "$report_no" : "$report_no_two",
          weather_condition: "$weather_condition",
          procedure_no: "$procedureDetails.vendor_doc_no",
          offer_date: "$offer_date",
          offer_name: "$offerDetails.user_name",
          qc_date: "$qc_date",
          qc_name: "$qcDetails.user_name",
          original_status: "$original_status",
          metal_condition: "$metal_condition",
          metal_rust_grade: "$metal_rust_grade",
          paint_system_no: "$paintDetails.paint_system_no",
          paint_system_id: "$paintDetails._id",
          prep_standard: "$paintDetails.surface_preparation",
          profile_requirement: "$paintDetails.profile_requirement",
          salt_test: "$paintDetails.salt_test",
          prime_paint: "$paintDetails.prime_paint",
          primer_app_method: "$paintDetails.primer_app_method",
          primer_dft_range: "$paintDetails.primer_dft_range",
          paint_manufacturer: "$paintManDetails.name",
          blasting_date: "$blasting_date",
          blasting_method: "$blasting_method",
          abrasive_type: "$abrasive_type",
          dust_level: "$dust_level",
          primer_date: "$primer_date",
          time: "$time",
          paint_batch_base: "$paint_batch_base",
          manufacture_date: "$manufacture_date",
          shelf_life: "$shelf_life",
          paint_batch_hardner: "$paint_batch_hardner",
          actual_surface_profile: "$actual_surface_profile",
          salt_test_reading: "$salt_test_reading",
          offer_notes: "$offer_notes",
          qc_notes: "$qc_notes",
          status: "$status",
          start_time: "$start_time",
          end_time: "$end_time",
          client: "$clientDetails.name",
          project_name: "$projectDetails.name",
          wo_no: "$projectDetails.work_order_no",
          project_po_no: "$projectDetails.work_order_no",
          items: {
            _id: "$items._id",
            drawing_no: "$drawingDetails.drawing_no",
            rev: "$drawingDetails.rev",
            sheet_no: "$drawingDetails.sheet_no",
            assembly_no: "$drawingDetails.assembly_no",
            assembly_quantity: "$drawingDetails.assembly_quantity",
            grid_no: "$gridDetails.grid_no",
            grid_qty: "$gridDetails.grid_qty",
            surface_used_grid_qty: "$items.surface_used_grid_qty",
            remarks: "$items.remarks",
            ...(report_no_two && {
              average_dft_primer: "$items.average_dft_primer",
              accept: {
                $cond: [
                  { $eq: ["$items.is_accepted", 2] },
                  "ACC",
                  {
                    $cond: [{ $eq: ["$items.is_accepted", 3] }, "REJ", "--"],
                  },
                ],
              },
            }),
          },
        },
      },
      {
        $group: {
          _id: {
            _id: "$_id",
            report_no: "$report_no",
            weather_condition: "$weather_condition",
            procedure_id: "$procedure_id",
            procedure_no: "$procedure_no",
            offer_date: "$offer_date",
            offer_name: "$offer_name",
            qc_date: "$qc_date",
            qc_name: "$qc_name",
            original_status: "$original_status",
            metal_condition: "$metal_condition",
            metal_rust_grade: "$metal_rust_grade",
            paint_system_no: "$paint_system_no",
            paint_system_id: "$paint_system_id",
            prep_standard: "$prep_standard",
            profile_requirement: "$profile_requirement",
            salt_test: "$salt_test",
            prime_paint: "$prime_paint",
            primer_app_method: "$primer_app_method",
            primer_dft_range: "$primer_dft_range",
            paint_manufacturer: "$paint_manufacturer",
            blasting_date: "$blasting_date",
            blasting_method: "$blasting_method",
            abrasive_type: "$abrasive_type",
            dust_level: "$dust_level",
            primer_date: "$primer_date",
            time: "$time",
            paint_batch_base: "$paint_batch_base",
            manufacture_date: "$manufacture_date",
            shelf_life: "$shelf_life",
            paint_batch_hardner: "$paint_batch_hardner",
            actual_surface_profile: "$actual_surface_profile",
            salt_test_reading: "$salt_test_reading",
            offer_notes: "$offer_notes",
            qc_notes: "$qc_notes",
            status: "$status",
            start_time: "$start_time",
            end_time: "$end_time",
            client: "$client",
            project_name: "$project_name",
            wo_no: "$wo_no",
            project_po_no: "$project_po_no",
          },
          items: { $push: "$items" },
        },
      },
      {
        $project: {
          _id: "$_id._id",
          report_no: "$_id.report_no",
          weather_condition: "$_id.weather_condition",
          procedure_id: "$_id.procedure_id",
          procedure_no: "$_id.procedure_no",
          offer_date: "$_id.offer_date",
          offer_name: "$_id.offer_name",
          qc_date: "$_id.qc_date",
          qc_name: "$_id.qc_name",
          original_status: "$_id.original_status",
          metal_condition: "$_id.metal_condition",
          metal_rust_grade: "$_id.metal_rust_grade",
          paint_system_no: "$_id.paint_system_no",
          paint_system_id: "$_id.paint_system_id",
          prep_standard: "$_id.prep_standard",
          profile_requirement: "$_id.profile_requirement",
          salt_test: "$_id.salt_test",
          prime_paint: "$_id.prime_paint",
          primer_app_method: "$_id.primer_app_method",
          primer_dft_range: "$_id.primer_dft_range",
          paint_manufacturer: "$_id.paint_manufacturer",
          blasting_date: "$_id.blasting_date",
          blasting_method: "$_id.blasting_method",
          abrasive_type: "$_id.abrasive_type",
          dust_level: "$_id.dust_level",
          primer_date: "$_id.primer_date",
          time: "$_id.time",
          paint_batch_base: "$_id.paint_batch_base",
          manufacture_date: "$_id.manufacture_date",
          shelf_life: "$_id.shelf_life",
          paint_batch_hardner: "$_id.paint_batch_hardner",
          actual_surface_profile: "$_id.actual_surface_profile",
          salt_test_reading: "$_id.salt_test_reading",
          offer_notes: "$_id.offer_notes",
          qc_notes: "$_id.qc_notes",
          status: "$_id.status",
          start_time: "$_id.start_time",
          end_time: "$_id.end_time",
          client: "$_id.client",
          project_name: "$_id.project_name",
          wo_no: "$_id.wo_no",
          project_po_no: "$_id.project_po_no",
          items: 1,
        },
      },
    ]);

    if (requestData.length && requestData.length > 0) {
      return { status: 1, result: requestData };
    } else {
      return { status: 0, result: [] };
    }
  } catch (error) {
    return { status: 2, result: error };
  }
};

exports.oneSurface = async (req, res) => {
  const { report_no, report_no_two } = req.body;
  if (req.user && !req.error) {
    try {
      const data = await getSurfaceInspectionOfferFunction(
        report_no,
        report_no_two
      );
      let requestData = data.result;

      if (data.status === 1) {
        sendResponse(res, 200, true, requestData, `Surface data list`);
      } else if (data.status === 0) {
        sendResponse(res, 200, true, [], `Surface data not found`);
      } else if (data.status === 2) {
        sendResponse(res, 500, false, {}, "Something went wrong11");
      }
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.downloadOneMultiSurface = async (req, res) => {
  const { report_no, report_no_two, print_date } = req.body;

  if (req.user && !req.error) {
    try {
      const data = await getSurfaceInspectionOfferFunction(
        report_no,
        report_no_two
      );

      let requestData = data.result[0];

      if (data.status === 1) {
        let headerInfo = {
          report_no: requestData?.report_no,
          weather_condition: requestData?.weather_condition,
          procedure_id: requestData?.procedure_id,
          procedure_no: requestData?.procedure_no,
          offer_date: requestData?.offer_date,
          offer_name: requestData?.offer_name,
          qc_date: requestData?.qc_date,
          qc_name: requestData?.qc_name,
          original_status: requestData?.original_status,
          metal_condition: requestData?.metal_condition,
          metal_rust_grade: requestData?.metal_rust_grade,
          paint_system_no: requestData?.paint_system_no,
          paint_system_id: requestData?.paint_system_id,
          prep_standard: requestData?.prep_standard,
          profile_requirement: requestData?.profile_requirement,
          salt_test: requestData?.salt_test,
          prime_paint: requestData?.prime_paint,
          primer_app_method: requestData?.primer_app_method,
          primer_dft_range: requestData?.primer_dft_range,
          paint_manufacturer: requestData?.paint_manufacturer,
          blasting_date: requestData?.blasting_date,
          blasting_method: requestData?.blasting_method,
          abrasive_type: requestData?.abrasive_type,
          dust_level: requestData?.dust_level,
          primer_date: requestData?.primer_date,
          time: requestData?.time,
          paint_batch_base: requestData?.paint_batch_base,
          manufacture_date: requestData?.manufacture_date,
          shelf_life: requestData?.shelf_life,
          paint_batch_hardner: requestData?.paint_batch_hardner,
          actual_surface_profile: requestData?.actual_surface_profile,
          salt_test_reading: requestData?.salt_test_reading,
          offer_notes: requestData?.offer_notes,
          qc_notes: requestData?.qc_notes,
          status: requestData?.status,
          start_time: requestData?.start_time,
          end_time: requestData?.end_time,
          client: requestData?.client,
          project_name: requestData?.project_name,
          wo_no: requestData?.wo_no,
          project_po_no: requestData?.project_po_no,
        };

        const template = fs.readFileSync(
          "templates/multiSurface.html",
          "utf-8"
        );
        const renderedHtml = ejs.render(template, {
          headerInfo,
          items: requestData?.items,
          logoUrl1: process.env.LOGO_URL_1,
          logoUrl2: process.env.LOGO_URL_2,
        });

        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          executablePath: PATH,
        });

        const page = await browser.newPage();

        await page.setContent(renderedHtml, {
          baseUrl: `${URI}`,
        });

        const pdfBuffer = await generatePDFA4WithoutPrintDate(page, {
          print_date,
        });

        await browser.close();

        const pdfsDir = path.join(__dirname, "../../../pdfs");
        if (!fs.existsSync(pdfsDir)) {
          fs.mkdirSync(pdfsDir);
        }

        let lastInspection = "";

        if (requestData) {
          const split = requestData.report_no.split("/");
          lastInspection = split[split.length - 2];
        }

        let x = "";
        if (lastInspection === "OFFER") {
          x = "offer";
        } else {
          x = "inspection";
        }

        const filename = `surface_${x}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, "../../../pdfs", filename);

        fs.writeFileSync(filePath, pdfBuffer);

        const fileUrl = `${URI}/pdfs/${filename}`;

        sendResponse(
          res,
          200,
          true,
          { file: fileUrl },
          "PDF downloaded Successfully"
        );
      } else if (data.status === 0) {
        sendResponse(res, 200, false, {}, `Surface data not found`);
      } else if (data.status === 2) {
        sendResponse(res, 500, false, {}, "Something went wrong");
      }
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong1111");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};
