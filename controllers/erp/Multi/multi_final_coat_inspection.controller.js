const FCInspection = require("../../../models/erp/Multi/multi_final_coat_inspection.model");
const FCOfferTable = require("../../../models/erp/Multi/offer_table_data/Paint/final_coat_offer_table.model");
const { TitleFormat } = require("../../../utils/enum");
const { sendResponse } = require("../../../helper/response");
const { default: mongoose } = require("mongoose");
const { Types: { ObjectId }, } = require("mongoose");
const MIOInspection = require("../../../models/erp/Multi/multi_mio_inspection.model");
const { addReleaseNote } = require("./release_note/multi_release_note.controller");
const { generatePDF, generatePDFA4, generatePDFA4WithoutPrintDate } = require("../../../utils/pdfUtils");
const ejs = require("ejs");
const fs = require("fs");
const XLSX = require("xlsx"); // for utility functions
const XLSXStyle = require("xlsx-style"); // for styling
const puppeteer = require("puppeteer");
const path = require("path");
const URI = process.env.PDF_URL;
const PATH = process.env.PDF_PATH;

exports.generateFCOffer = async (req, res) => {
    const {
        weather_condition,
        procedure_no,
        paint_system_id,
        final_date,
        time,
        paint_batch_base,
        manufacture_date,
        shelf_life,
        paint_batch_hardner,
        offered_by,
        offer_notes,
        start_time,
        end_time,
        items,
        project
    } = req.body;

    const itemArray = JSON.parse(items);
    const weatherCondition = (typeof weather_condition !== 'undefined' && weather_condition !== null)
        ? JSON.parse(weather_condition)
        : [];
    // const itemArray = items;
    // const weatherCondition = weather_condition.length > 0 ? weather_condition : [];

    if (!req.user || req.error) {
        return sendResponse(res, 401, false, {}, "Unauthorized");
    }

    if (!paint_system_id || !procedure_no || !offered_by || !project || itemArray.length === 0) {
        sendResponse(res, 400, false, {}, "Missing parameters!");
    }

    try {
        let lastOffer = await FCInspection.findOne({ deleted: false, report_no: { $regex: `/${project}/` } }, { deleted: 0 }, { sort: { createdAt: -1 } });
        let newOfferNo = "1";
        if (lastOffer && lastOffer.report_no) {
            const split = lastOffer.report_no.split('/');
            const lastOfferNo = parseInt(split[split.length - 1]);
            newOfferNo = lastOfferNo + 1;
        }
        const gen_voucher_no = TitleFormat.FINALCOATOFFERNO.replace('/PROJECT/', `/${project}/`) + newOfferNo;

        const addFCIoffer = await FCInspection.create({
            report_no: gen_voucher_no,
            offer_date: Date.now(),
            weather_condition: weatherCondition,
            procedure_no,
            paint_system_id,
            final_date,
            time,
            paint_batch_base,
            manufacture_date,
            shelf_life,
            paint_batch_hardner,
            offered_by,
            offer_notes,
            start_time,
            end_time,
            items: itemArray,
        })

        if (addFCIoffer) {
            for (const item of itemArray) {
                const { fc_offer_id } = item;
                const deleteFCOffer = await FCOfferTable.deleteOne({ _id: new ObjectId(fc_offer_id), });
            }
            sendResponse(res, 200, true, addFCIoffer, "Final Coat added successfully");
        } else {
            sendResponse(res, 400, false, {}, "Final coatcoat not added");
        }
    } catch (error) {
        console.log(error);
        sendResponse(res, 500, false, {}, "Something went wrong");
    }
}

exports.getMultiFCInspectionOffer = async (req, res) => {
    const { project_id, paint_system_id, report_no, dispatch_site, is_accepted } = req.body;
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
                let acce = JSON.parse(is_accepted)
                matchObj["items.is_accepted"] = acce;
            }

            let requestData = await FCInspection.aggregate([
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
                        localField: "items.dispatch_id",
                        foreignField: "_id",
                        as: "dispatchDetails",
                    },
                },
                {
                    $lookup: {
                        from: "multi-erp-mio-inspections",
                        localField: "items.main_id",
                        foreignField: "_id",
                        as: "mioDetails",
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
                        mioDetails: { $arrayElemAt: ["$mioDetails", 0] },
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
                        offer_notes: "$offer_notes",
                        qc_date: "$qc_date",
                        qc_name: "$qcDetails.user_name",
                        qc_notes: "$qc_notes",
                        paint_system_no: "$paintDetails.paint_system_no",
                        paint_system_id: "$paintDetails._id",
                        start_time: "$start_time",
                        end_time: "$end_time",
                        final_date: "$final_date",
                        time: "$time",
                        paint_batch_base: "$paint_batch_base",
                        manufacture_date: "$manufacture_date",
                        shelf_life: "$shelf_life",
                        paint_batch_hardner: "$paint_batch_hardner",
                        status: "$status",
                        client: "$clientDetails.name",
                        project_name: "$projectDetails.name",
                        wo_no: "$projectDetails.work_order_no",
                        project_po_no: "$projectDetails.work_order_no",
                        createdAt: "$createdAt",
                        items: {
                            _id: "$items._id",
                            main_id: "$_id",
                            mio_id: "$mioDetails._id",
                            mio_offer_no: "$mioDetails.report_no",
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
                            fc_balance_grid_qty: "$items.fc_balance_grid_qty",
                            fc_used_grid_qty: "$items.fc_used_grid_qty",
                            moved_next_step: "$items.moved_next_step",
                            average_dft_final_coat: "$items.average_dft_final_coat",
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
                            offer_notes: "$offer_notes",
                            qc_date: "$qc_date",
                            qc_name: "$qc_name",
                            qc_notes: "$qc_notes",
                            paint_system_no: "$paint_system_no",
                            paint_system_id: "$paint_system_id",
                            start_time: "$start_time",
                            end_time: "$end_time",
                            final_date: "$final_date",
                            time: "$time",
                            paint_batch_base: "$paint_batch_base",
                            manufacture_date: "$manufacture_date",
                            shelf_life: "$shelf_life",
                            paint_batch_hardner: "$paint_batch_hardner",
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
                        offer_notes: "$_id.offer_notes",
                        qc_date: "$_id.qc_date",
                        qc_name: "$_id.qc_name",
                        qc_notes: "$_id.qc_notes",
                        paint_system_no: "$_id.paint_system_no",
                        paint_system_id: "$_id.paint_system_id",
                        start_time: "$_id.start_time",
                        end_time: "$_id.end_time",
                        final_date: "$_id.final_date",
                        time: "$_id.time",
                        paint_batch_base: "$_id.paint_batch_base",
                        manufacture_date: "$_id.manufacture_date",
                        shelf_life: "$_id.shelf_life",
                        paint_batch_hardner: "$_id.paint_batch_hardner",
                        status: "$_id.status",
                        client: "$_id.client",
                        project_name: "$_id.project_name",
                        wo_no: "$_id.wo_no",
                        project_po_no: "$_id.project_po_no",
                        createdAt: "$_id.createdAt",
                        items: 1,
                    },
                },
                {
                    $sort: { "createdAt": -1 }
                },
            ]);

            if (requestData.length && requestData.length > 0) {
                sendResponse(res, 200, true, requestData, `Final coat data list`);
            } else {
                sendResponse(res, 200, true, [], `Final coat data not found`);
            }
        } catch (error) {
            console.log(error);
            sendResponse(res, 500, false, {}, "Something went wrong");
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized");
    }
};

async function getLastInspection(project) {
  try {
    const pipeline = [
      {
        $match: {
          deleted: false,
          report_no_two: {
            $regex: `^VE/${project}/STR/FINAL-PAINT/\\d+$`,
            $options: 'i'
          }
        }
      },
      {
        $addFields: {
          inspectionNumber: {
            $toInt: {
              $arrayElemAt: [
                { $split: ["$report_no_two", "/"] },
                -1
              ]
            }
          }
        }
      },
      { $sort: { inspectionNumber: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 1,
          report_no_two: 1,
          createdAt: 1,
          inspectionNumber: 1
        }
      }
    ];

    const [lastInspection] = await FCInspection.aggregate(pipeline);
    console.log('Aggregation result:', lastInspection); // Debug log
    return lastInspection || null;
  } catch (error) {
    console.error('Error fetching last inspection:', error);
    throw error;
  }
}
exports.verifyFCQcDetails = async (req, res) => {
    const { id, items, qc_name, project, qc_notes } = req.body;

    if (!req.user || req.error) {
        return sendResponse(res, 401, false, {}, "Unauthorized");
    }

    const itemArray = JSON.parse(items);
    // const itemArray = items;

    if (!id || itemArray.length === 0 || !qc_name || !project) {
        return sendResponse(res, 400, false, {}, "Missing parameter");
    }

    try {
        // let lastInspection = await FCInspection.findOne(
        //     { deleted: false, report_no_two: { $regex: `/${project}/` } }, {}, { sort: { updatedAt: -1 } }
        // );
        const lastInspection = await getLastInspection(project);
        let inspectionNo = "1";
        if (lastInspection && lastInspection.report_no_two) {
            const split = lastInspection.report_no_two.split("/");
            const lastInspectionNo = parseInt(split[split.length - 1]);
            inspectionNo = lastInspectionNo + 1;
        }
        const gen_report_no =
            TitleFormat.FINALCOATINSPECTNO.replace("/PROJECT/", `/${project}/`) +
            inspectionNo;

        let fcInspection = await FCInspection.findById(id);
        if (!fcInspection) {
            return sendResponse(res, 404, false, {}, "FC inspection not found");
        }

        let status = 1;

        if (itemArray.length > 0) {
            if (itemArray.every(item => item.is_accepted === 2)) status = 3;
            else if (itemArray.every(item => item.is_accepted === 3)) status = 4;
            else if (itemArray.some(item => item.is_accepted === 2) && itemArray.some(item => item.is_accepted === 3)) status = 2;
        }

        const verifyFC = await FCInspection.findByIdAndUpdate(
            { _id: id },
            {
                report_no_two: gen_report_no,
                qc_name: qc_name,
                qc_date: new Date(),
                qc_notes: qc_notes,
                status: status,
            },
            { new: true }
        )

        let matchedCount = 0;
        let modifiedCount = 0;

        for (const item of itemArray) {
            const { _id, average_dft_final_coat, is_accepted } = item;
            const result = await FCInspection.updateOne(
                { _id: id, "items._id": _id },
                {
                    $set: {
                        "items.$.average_dft_final_coat": average_dft_final_coat,
                        "items.$.is_accepted": is_accepted,
                    },
                }
            );
            matchedCount += result.matchedCount;
            modifiedCount += result.modifiedCount;
        }

        if (verifyFC && matchedCount === modifiedCount && matchedCount === itemArray.length) {
            for (const item of itemArray) {
                const { mio_id, drawing_id, grid_id, fc_used_grid_qty, is_accepted } = item;

                if (is_accepted === 3) {
                    const result = await MIOInspection.updateOne(
                        { _id: mio_id, "items.drawing_id": drawing_id, "items.grid_id": grid_id },
                        {
                            $inc: {
                                "items.$.moved_next_step": -fc_used_grid_qty,
                            },
                        }
                    );
                }
            }
                 console.log("itemArray", itemArray[0]);

            const release_note = await addReleaseNote({
                itemArray, id
            })
            return sendResponse(res, 200, true, {}, "Final coat verified successfully");
        } else {
            return sendResponse(res, 400, false, {}, "Final coat not verified");
        }
    } catch (error) {
        console.log(error)
        sendResponse(res, 500, false, {}, "Something went wrong");
    }
}

const getFCInspectionOfferFunction = async (report_no, report_no_two) => {
    try {
        let matchObj = { deleted: false };
        if (report_no) {
            matchObj = { ...matchObj, report_no: report_no };
        }
        if (report_no_two) {
            matchObj = { ...matchObj, report_no_two: report_no_two };
        }

        let requestData = await FCInspection.aggregate([
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
                    localField: "items.dispatch_id",
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
                    offer_notes: "$offer_notes",
                    offer_name: "$offerDetails.user_name",
                    qc_date: "$qc_date",
                    qc_notes: "$qc_notes",
                    qc_name: "$qcDetails.user_name",
                    start_time: "$start_time",
                    end_time: "$end_time",
                    paint_system_no: "$paintDetails.paint_system_no",
                    paint_system_id: "$paintDetails._id",
                    final_paint: "$paintDetails.final_paint",
                    final_paint_app_method: "$paintDetails.final_paint_app_method",
                    final_paint_dft_range: "$paintDetails.final_paint_dft_range",
                    paint_manufacturer: "$paintManDetails.name",
                    final_date: "$final_date",
                    time: "$time",
                    paint_batch_base: "$paint_batch_base",
                    manufacture_date: "$manufacture_date",
                    shelf_life: "$shelf_life",
                    paint_batch_hardner: "$paint_batch_hardner",
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
                        fc_used_grid_qty: "$items.fc_used_grid_qty",
                        remarks: "$items.remarks",
                        ...(report_no_two && {
                            average_dft_final_coat: "$items.average_dft_final_coat",
                            accept: {
                                $cond: [
                                    { $eq: ["$items.is_accepted", 2] },
                                    "ACC",
                                    {
                                        $cond: [
                                            { $eq: ["$items.is_accepted", 3] },
                                            "REJ", "--"]
                                    }
                                ]
                            }
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
                        procedure_no: "$procedure_no",
                        offer_date: "$offer_date",
                        offer_notes: "$offer_notes",
                        offer_name: "$offer_name",
                        qc_date: "$qc_date",
                        qc_notes: "$qc_notes",
                        qc_name: "$qc_name",
                        start_time: "$start_time",
                        end_time: "$end_time",
                        paint_system_no: "$paint_system_no",
                        paint_system_id: "$paint_system_id",
                        final_paint: "$final_paint",
                        final_paint_app_method: "$final_paint_app_method",
                        final_paint_dft_range: "$final_paint_dft_range",
                        paint_manufacturer: "$paint_manufacturer",
                        final_date: "$final_date",
                        time: "$time",
                        paint_batch_base: "$paint_batch_base",
                        manufacture_date: "$manufacture_date",
                        shelf_life: "$shelf_life",
                        paint_batch_hardner: "$paint_batch_hardner",
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
                    procedure_no: "$_id.procedure_no",
                    offer_date: "$_id.offer_date",
                    offer_notes: "$_id.offer_notes",
                    offer_name: "$_id.offer_name",
                    qc_date: "$_id.qc_date",
                    qc_notes: "$_id.qc_notes",
                    qc_name: "$_id.qc_name",
                    start_time: "$_id.start_time",
                    end_time: "$_id.end_time",
                    paint_system_no: "$_id.paint_system_no",
                    paint_system_id: "$_id.paint_system_id",
                    final_paint: "$_id.final_paint",
                    final_paint_app_method: "$_id.final_paint_app_method",
                    final_paint_dft_range: "$_id.final_paint_dft_range",
                    paint_manufacturer: "$_id.paint_manufacturer",
                    final_date: "$_id.final_date",
                    time: "$_id.time",
                    paint_batch_base: "$_id.paint_batch_base",
                    manufacture_date: "$_id.manufacture_date",
                    shelf_life: "$_id.shelf_life",
                    paint_batch_hardner: "$_id.paint_batch_hardner",
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
        console.log(error);
        return { status: 2, result: error };
    }
};

exports.oneFC = async (req, res) => {
    const { report_no, report_no_two } = req.body;
    if (req.user && !req.error) {
        try {
            const data = await getFCInspectionOfferFunction(report_no, report_no_two);
            let requestData = data.result;

            if (data.status === 1) {
                sendResponse(res, 200, true, requestData, `FC data list`);
            } else if (data.status === 0) {
                sendResponse(res, 200, true, [], `FC data not found`);
            } else if (data.status === 2) {
                console.log("error", data.result);
                sendResponse(res, 500, false, {}, "Something went wrong11");
            }
        } catch (error) {
            sendResponse(res, 500, false, {}, "Something went wrong");
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized");
    }
};

exports.downloadOneMultiFC = async (req, res) => {
    const { report_no, report_no_two, print_date } = req.body;
    if (req.user && !req.error) {
        try {
            const data = await getFCInspectionOfferFunction(report_no, report_no_two);
            let requestData = data.result[0];

            if (data.status === 1) {
                let headerInfo = {
                    report_no: requestData?.report_no,
                    weather_condition: requestData?.weather_condition,
                    procedure_no: requestData?.procedure_no,
                    offer_date: requestData?.offer_date,
                    offer_name: requestData?.offer_name,
                    offer_notes: requestData?.offer_notes,
                    qc_date: requestData?.qc_date,
                    qc_name: requestData?.qc_name,
                    qc_notes: requestData?.qc_notes,
                    start_time: requestData?.start_time,
                    end_time: requestData?.end_time,
                    paint_system_no: requestData?.paint_system_no,
                    paint_system_id: requestData?.paint_system_id,
                    final_paint: requestData?.final_paint,
                    final_paint_app_method: requestData?.final_paint_app_method,
                    final_paint_dft_range: requestData?.final_paint_dft_range,
                    paint_manufacturer: requestData?.paint_manufacturer,
                    final_date: requestData?.final_date,
                    time: requestData?.time,
                    paint_batch_base: requestData?.paint_batch_base,
                    manufacture_date: requestData?.manufacture_date,
                    shelf_life: requestData?.shelf_life,
                    paint_batch_hardner: requestData?.paint_batch_hardner,
                    status: requestData?.status,
                    start_time: requestData?.start_time,
                    end_time: requestData?.end_time,
                    client: requestData?.client,
                    project_name: requestData?.project_name,
                    wo_no: requestData?.wo_no,
                    project_po_no: requestData?.project_po_no,
                };

                const template = fs.readFileSync("templates/multiFC.html", "utf-8");
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

                const filename = `final_coat_${x}_${Date.now()}.pdf`;
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
                sendResponse(res, 200, false, {}, `FC data not found`);
            } else if (data.status === 2) {
                sendResponse(res, 500, false, {}, "Something went wrong");
            }
        } catch (error) {
            console.log("error", error);
            sendResponse(res, 500, false, {}, "Something went wrong1111");
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized");
    }
};