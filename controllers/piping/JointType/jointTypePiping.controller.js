const JointTypePiping = require("../../../models/piping/JointType/joint_typePiping.model");
const { sendResponse } = require("../../../helper/response");

exports.getJointTypePiping = async (req, res) => {
  if (req.user && !req.error) {
    let status = req.query.status
    let qurey = { deleted: false }
    if (status) {
      qurey.status = status
    }

    try {
      let data = await JointTypePiping.find(qurey, { deleted: 0, __v: 0 }).sort({ createdAt: -1 }).lean()
      if (data) {
        sendResponse(res, 200, true, data, "Joint-Type data found successfully");
      } else {
        sendResponse(res, 200, true, data, "Joint-Type data not found");
      }
    } catch (err) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.manageJointTypePiping = async (req, res) => {
  const { id, name, status } = req.body;

  if (req.user && !req.error) {
    try {
      if (name) {
        if (!id) {
          await JointTypePiping.create({ name: name }).then((data) => {
            sendResponse(res, 200, true, {}, "Joint-Type added successfully");
          }).catch(error => {
            sendResponse(res, 400, false, {}, "Joint-Type already exists");
          })
        } else {
          const resData = await JointTypePiping.findOneAndUpdate({ _id: id }, {
            name: name,
            status: status
          })
          if (resData) {
            sendResponse(res, 200, true, {}, "Joint Type updated successfully");
          } else {
            sendResponse(res, 404, false, {}, "Joint Type not found")
          }
        }
      } else {
        return sendResponse(res, 400, false, {}, "Missing parameters");
      }
    } catch (err) {
      return sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.deleteJointTypePiping = async (req, res) => {
  const { id } = req.body;
  if (req.user && !req.error && id) {
    try {
      await JointTypePiping.findByIdAndUpdate(id, { deleted: true }).then((data) => {
        if (data) {
          sendResponse(res, 200, true, {}, "Joint-Type deleted successfully");
        }
      });
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

