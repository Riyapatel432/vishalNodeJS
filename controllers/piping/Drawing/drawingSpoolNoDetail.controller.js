const SpoolNoWiseDetail = require('../../../models/piping/Drawing/drawingSpoolNoJointDetail.model');
const { sendResponse } = require('../../../helper/response');
const upload = require('../../../helper/multerConfig');
const xlsx = require('xlsx');
const path = require('path');
const { downloadFormat } = require('../../../helper/index');

exports.getSpoolNoWiseDetail = async (req, res) => {
    if (req.user && !req.error) {
        try {
            await SpoolNoWiseDetail.find({ deleted: false }, { deleted: 0 }).then(data => {
                if (data) {
                    sendResponse(res, 200, true, data, "Spool No list");
                } else {
                    sendResponse(res, 400, false, [], "Spool No found");
                }
            })
        } catch (error) {
            sendResponse(res, 500, false, {}, "Something went wrong");
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized")
    }
}

exports.manageSpoolNoWiseDetail = async (req, res) => {
    // console.log(req.user);
    const { spool_no, drawing_id, project_id, id } = req.body
    if (req.user) {
        if (spool_no) {
            const spoolNo = new SpoolNoWiseDetail({
                 drawing_id,
        project_id,
                spool_no: spool_no,

            });

            if (!id) {
                try {
                    await spoolNo.save(spoolNo).then(data => {
                        sendResponse(res, 200, true, data, "Spool No added successfully")
                    }).catch(error => {
                        sendResponse(res, 400, false, error, "Spool No already exists");
                    })
                } catch (error) {
                    sendResponse(res, 500, false, {}, "Something went wrong");
                }
            } else {
                await SpoolNoWiseDetail.findByIdAndUpdate(id, {
                    spool_no: spool_no,
                     drawing_id,
        project_id,
        
                }).then(data => {
                    if (data) {
                        sendResponse(res, 200, true, {}, "Spool No updated successfully")
                    } else {
                        sendResponse(res, 200, true, {}, "Spool No not found")
                    }
                })
            }
        } else {
            sendResponse(res, 400, false, {}, "Missing parameters");
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized");
    }
}

exports.deleteSpoolNoWiseDetail = async (req, res) => {
    const { id } = req.body;
    if (req.user && !req.error && id) {
        try {
            await SpoolNoWiseDetail.findByIdAndUpdate(id, { deleted: true }).then(data => {
                if (data) {
                    sendResponse(res, 200, true, {}, "Spool No deleted successfully")
                }
            })
        } catch (error) {
            sendResponse(res, 500, false, {}, "Something went wrong")
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized")
    }
}
