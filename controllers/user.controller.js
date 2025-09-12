const User = require('../models/users.model');
const Employee = require('../models/payroll/employ.model');
const MonthlyAttendance = require('../models/payroll/monthly.attendance.model');
const DailyAttendance = require('../models/payroll/daily.attendance.model');
const Earning = require('../models/payroll/earning.model');
const Deduction = require('../models/payroll/deduction.model');

const Orders = require('../models/store/order.model');
const Party = require('../models/store/party.model');
const Projects = require('../models/project.model');
const Items = require('../models/store/item.model');
const Transports = require('../models/store/transport.model');
const InventoryLocation = require('../models/store/inventory_location.model');
const ItemStocks = require('../models/store/item_stock.model')

const Fitup = require('../models/erp/Execution/fitup_inspection.model');
const WeldVisual = require('../models/erp/Execution/weld_inspection_offer.model');
const FinalDimension = require('../models/erp/Execution/fd_inspection_offer.model');
const PmsStock = require('../models/store/item_stock.model');

const { sendResponse } = require('../helper/response');
const { Types: { ObjectId } } = require('mongoose');

const Otps = require('../models/otp.model');
const { sendMail } = require('../helper');
const { generateOtp } = require('../helper');

const jwt = require('jsonwebtoken');
const md5 = require('md5');
const moment = require('moment');
const port = process.env.PORT;

const Drawing = require('../models/erp/planner/draw.model');
const MultiIssueAcc = require('../models/erp/Multi/multi_issue_acceptance.model');
const MultiFitupAcc = require('../models/erp/Multi/multi_fitup_inspection.model');
const MultiWeldAcc = require('../models/erp/Multi/multi_weld_inspection.model');
const MultiNdtAcc = require('../models/erp/Multi/multi_ndt_detail.model');
const finalDimensionAcc = require('../models/erp/Multi/multi_fd_master.model');
const DispatchNoteAcc = require('../models/erp/Multi/dispatch_note/multi_dispatch_note.model');
const SurafcePaint = require('../models/erp/Multi/multi_surface_inspection.model');
const MioPaint = require('../models/erp/Multi/multi_mio_inspection.model');
const FinalCoatPaint = require('../models/erp/Multi/multi_final_coat_inspection.model');
const MultiPackingList = require('../models/erp/Multi/packing/multi_packing.model');

exports.getUser = async (req, res) => {
    if (req.user && !req.error) {
        try {
            await User.find({ deleted: false }, { deleted: 0, password: 0 })
                .populate('firm', '_id name')
                .populate('year', 'start_year end_year')
                .populate('role', 'name')
                .populate('erpRole', 'name')
                .populate('project', 'name ')
                .sort({ createdAt: -1 })
                .lean()
                .then(data => {
                    if (data) {
                        sendResponse(res, 200, true, data, "Users list")
                    } else {
                        sendResponse(res, 400, false, {}, "Users not found")
                    }
                })
        } catch (error) {
            sendResponse(res, 500, false, {}, "Something went wrong")
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized")
    }
}

// exports.manageUser = async (req, res) => {
//     const { user_name, email, password, year, firm, project,
//         role, product, erpRole, id, status, pay_subUser } = req.body;
//     if (req.user) {
//         if (user_name && email && role) {

//             let firmIds = firm;
//             let yearIds = year;
//             if (product === 'Project Store' || product === 'Project Fabrication') {
//                 firmIds = [];
//                 yearIds = [];
//             } else {
//                 if (typeof firm === 'string') {
//                     firmIds = JSON.parse(firm);
//                 }
//                 if (typeof year === 'string') {
//                     yearIds = JSON.parse(year);
//                 }
//             }

//             let projectIds = project;
//             if (typeof project === 'string') {
//                 projectIds = JSON.parse(project);
//             }
//             const parseErpRole = erpRole !== "undefined" ? JSON.parse(erpRole) : [];

//             if (Array.isArray(firmIds) && Array.isArray(yearIds) && Array.isArray(projectIds)) {
//                 firmIds = firmIds.map(f => new ObjectId(f.id));
//                 yearIds = yearIds.map(y => new ObjectId(y.id));
//                 projectIds = projectIds.map(p => new ObjectId(p.id));

//                 if (!id) {
//                     try {
//                         const user = new User({
//                             user_name: user_name,
//                             email: email,
//                             password: md5(password),
//                             year: yearIds,
//                             firm: firmIds,
//                             project: projectIds ? projectIds : null,
//                             role: role,
//                             product: product,
//                             erpRole: parseErpRole,
//                             pay_subUser: pay_subUser,
                           
//                         });

//                         await user.save(user).then(data => {
//                             sendResponse(res, 200, true, {}, "User added successfully")
//                         }).catch(error => {
//                             sendResponse(res, 400, false, error, "User already exists");
//                         })
//                     } catch (error) {
//                         sendResponse(res, 500, false, {}, "Something went wrong");
//                     }
//                 } else {

//                     const updateFields = {
//                         user_name: user_name,
//                         email: email,
//                         year: yearIds,
//                         firm: firmIds,
//                         role: role,
//                         product: product,
//                         project: projectIds ? projectIds : null,
//                         erpRole: parseErpRole,
//                         status: status,
//                         pay_subUser: pay_subUser,
                       
//                     };

//                     if (password) {
//                         updateFields.password = md5(password);
//                     }

//                     await User.findByIdAndUpdate(id, updateFields).then(data => {
//                         if (data) {
//                             sendResponse(res, 200, true, {}, "User updated successfully")
//                         } else {
//                             sendResponse(res, 404, false, {}, "User not found")
//                         }
//                     })
//                 }

//             } else {
//                 sendResponse(res, 400, false, {}, "Firm and Year data is not in the correct format");
//             }
//         } else {
//             sendResponse(res, 400, false, {}, "Missing parameters");
//         }
//     } else {
//         sendResponse(res, 401, false, {}, "Unauthorized");
//     }
// }


exports.manageUser = async (req, res) => {
  const {
    user_name, email, password, year, firm, project,
    role, product, erpRole, id, status,
    pay_subUser, pay_bankDetail
  } = req.body;

  if (!req.user) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  if (!(user_name && email && role)) {
    return sendResponse(res, 400, false, {}, "Missing parameters");
  }

  try {
    // Parse firm/year/project IDs if needed
    let firmIds = firm;
    let yearIds = year;
    let projectIds = project;

    if (product === 'Project Store' || product === 'Project Fabrication') {
      firmIds = [];
      yearIds = [];
    } else {
      if (typeof firm === 'string') firmIds = JSON.parse(firm);
      if (typeof year === 'string') yearIds = JSON.parse(year);
    }

    if (typeof project === 'string') projectIds = JSON.parse(project);

    const parseErpRole = erpRole !== "undefined" ? JSON.parse(erpRole) : [];

    if (!Array.isArray(firmIds) || !Array.isArray(yearIds) || !Array.isArray(projectIds)) {
      return sendResponse(res, 400, false, {}, "Firm, Year, or Project data is not in correct format");
    }

    // Convert string IDs to ObjectIds
    firmIds = firmIds.map(f => new ObjectId(f.id));
    yearIds = yearIds.map(y => new ObjectId(y.id));
    projectIds = projectIds.map(p => new ObjectId(p.id));

    // ✅ Safely parse Boolean flags
    const isSubUser = pay_subUser === true || pay_subUser === 'true';
    const isBankDetail = pay_bankDetail === true || pay_bankDetail === 'true';

    if (!id) {
      // ✅ CREATE NEW USER
      const user = new User({
        user_name,
        email,
        password: md5(password),
        year: yearIds,
        firm: firmIds,
        project: projectIds.length > 0 ? projectIds : null,
        role,
        product,
        erpRole: parseErpRole,
        pay_subUser: isSubUser,
        pay_bankDetail: isBankDetail,
      });

      await user.save()
        .then(() => sendResponse(res, 200, true, {}, "User added successfully"))
        .catch(error => sendResponse(res, 400, false, error, "User already exists"));

    } else {
      // ✅ UPDATE EXISTING USER
      const updateFields = {
        user_name,
        email,
        year: yearIds,
        firm: firmIds,
        role,
        product,
        project: projectIds.length > 0 ? projectIds : null,
        erpRole: parseErpRole,
        status,
        pay_subUser: isSubUser,
        pay_bankDetail: isBankDetail,
      };

      if (password) {
        updateFields.password = md5(password);
      }

      const updated = await User.findByIdAndUpdate(id, updateFields);

      if (updated) {
        sendResponse(res, 200, true, {}, "User updated successfully");
      } else {
        sendResponse(res, 404, false, {}, "User not found");
      }
    }

  } catch (error) {
    console.error("User manage error:", error);
    sendResponse(res, 500, false, {}, "Something went wrong");
  }
};



exports.deleteUser = async (req, res) => {
    const { id } = req.body;
    if (req.user && !req.error && id) {
        try {
            await User.findByIdAndUpdate(id, { deleted: true }).then(data => {
                if (data) {
                    sendResponse(res, 200, true, {}, "User deleted successfully")
                }
            })
        } catch (error) {
            sendResponse(res, 500, false, {}, "Something went wrong")
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized")
    }
}

exports.loginUser = async (req, res) => {
    const { email, password } = req.body
    if (email && password) {
        await User.findOne({
            email: email.trim().toLowerCase()
        })
            .populate('year', 'start_year end_year  ')
            .populate('firm', 'name')
    
            .populate({
                path: 'project',
                select: 'name firm_id year_id',
                //   select: 'name  year_id',
                populate: ([
                    { path: 'firm_id', select: 'name' },
                    { path: 'year_id', select: 'start_year end_year' }
                ])
            })
            .populate('erpRole', 'name')
            .then(data => {
                if (data != null) {
                    let decryptedPassword = md5(password);

                    if (decryptedPassword == data.password) {

                        const token = jwt.sign(
                            { id: data._id, email: data.email },
                            process.env.SECRET_KEY_JWT
                        );

                        if (data.status == false) {
                            return sendResponse(res, 400, false, {}, "User has been blocked");
                        }
                        if (data.deleted == true) {
                            return sendResponse(res, 400, false, {}, "User has been deleted");
                        }

                        const newData = {
                            id: data._id,
                            name: data.user_name,
                            email: data.email,
                            year: data.year,
                             firm: data.firm,
    //                           firm: {
    //     _id: data.firm._id,
    //     name: data.firm.name,
    //     challan_prefix: data.firm.challan_prefix // Make sure this is included
    // },
                            product: data.product,
                            project: data.project ? data.project : null,
                            erpRole: data.erpRole,
                            pay_subUser: data.pay_subUser,
                            token
                        }
                        if (parseInt(port) === 7000) {
                            loginUserAlert({ name: data.user_name, userEmail: data.email, erpRole: data.erpRole });
                        }
                    
                        sendResponse(res, 200, true, newData, "Login Successfully");
                    } else {
                        sendResponse(res, 400, false, {}, "Invalid credentials");
                    }
                } else {
                    sendResponse(res, 400, false, {}, "Email not register");
                }
            }).catch((err) => {
                sendResponse(res, 400, false, {}, "Some error occurred.");
                console.log(err, '@@')
            });
    } else {
        sendResponse(res, 400, false, {}, "Missing parameters");
    }
}

exports.userForgetPassword = async (req, res) => {
    const { email } = req.body

    if (email) {
        const userData = await User.findOne({ email });

        if (userData) {
            const otp = await generateOtp(email);

            const html = `<table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="font-family: Arial, sans-serif; padding: 20px;">
            <tr>
                <td>
                    <table style="background-color: #fff; max-width:600px; margin:0 auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Password Reset</h2>
                                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Hi ${email},</p>
                                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">You requested a password reset for your account. Click the link below to reset your password:</p>
                                <p style="background-color: #007bff; color: #fff; text-decoration: none; font-size: 16px; padding: 12px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`

            const sendingEmail = await sendMail("Reset Password Link", email, html);

            if (sendingEmail) {
                // console.log(sendingEmail, '@@@')
                sendResponse(res, 200, true, {}, "Verification Code Sent")
            } else {
                sendResponse(res, 400, true, {}, "Something went wrong while sending email");
            }
        } else {
            sendResponse(res, 400, false, [], "Email does not exists")
        }
    } else {
        sendResponse(res, 400, false, {}, "Missing parameters")
    }
}

exports.userVerifyOtp = async (req, res) => {
    const { email, otp } = req.body

    if (email && otp) {
        await Otps.findOne({
            email: (email.trim().toLowerCase()),
        }).then(async (data) => {
            if (data._id) {
                if (data.otp == otp) {
                    var dates = Date.now();
                    if (data.expire_time < dates) {
                        sendResponse(res, 400, false, {}, "The OTP code has expired");
                    } else {
                        await Otps.findByIdAndUpdate(
                            data._id,
                            { otp: "", expire_time: "" },
                            { useFindAndModify: false }
                        )
                            .then(async (datas) => {
                                sendResponse(res, 200, true, {}, "Otp verify successfully");
                            })
                            .catch((err) => {
                                sendResponse(res, 400, false, {}, "Some error occurred while verifing OTP.");
                            });
                    }
                } else {
                    sendResponse(res, 400, false, {}, "The OTP code is incorrect");
                }
            }
        }).catch((err) => {
            sendResponse(res, 400, false, {}, "Some error occurred while verifing OTP.");
        });
    } else {
        sendResponse(res, 400, false, {}, "Missing Parameters");
    }
}

exports.userResetPassword = async (req, res) => {
    const { email, new_password } = req.body;
    if (email && new_password) {
        await User.findOne({ email: email })
            .then(async (datas) => {
                if (datas) {
                    if (datas.password != md5(new_password)) {
                        await User.findOneAndUpdate({ email: email }, { $set: { password: md5(new_password) } })
                            .then(async () => {
                                sendResponse(res, 200, true, {}, "Password reset successfully.");
                            })
                            .catch(() => {
                                sendResponse(res, 500, false, {}, "Internal server error");
                            });
                        return
                    } else {
                        sendResponse(res, 400, false, {}, "New password should not same as old password");
                    }
                } else {
                    sendResponse(res, 400, false, {}, "User does not exists");
                }
            }).catch((err) => {
                console.log(err);
                sendResponse(res, 400, false, err, "Some error occurred.");
            });
    } else {
        sendResponse(res, 400, false, {}, "Missing Parameters");
    }
}

exports.getUserProfile = async (req, res) => {
    if (req.user && !req.error) {
        const userData = await User.findOne({ _id: req.user.id }, { password: 0 })
            .populate('year', 'start_year end_year')
            .populate('firm', '_id name')
            .populate({
                path: 'project',
                select: 'name department location startDate endDate party label projectManager firm_id year_id',
                populate: [
                    { path: 'department', select: 'name' },
                    { path: 'location', select: 'name' },
                    { path: 'party', select: 'name' },
                    { path: 'projectManager', select: 'full_name' },
                    { path: 'firm_id', select: 'name' },
                    { path: 'year_id', select: 'start_year end_year' }
                ]
            })
            .lean()

        if (userData) {
            res.status(200).send({
                success: true,
                data: userData,
                message: "User data"
            });
        } else {
            res.status(404).send({
                message: "User data not found",
                success: true,
                data: [],
            });
        }
    } else {
        res.status(401).send({
            error: { message: "Unauthorized" },
        });
    }
}

exports.changesPassword = async (req, res) => {
    if (req.user) {
        var conditions = { _id: req.user.id };
        const getPassword = await User.findOne(conditions);

        if (getPassword.password == md5(req.body.old_password)) {

            if (getPassword.password == md5(req.body.new_password)) {
                res.status(400).send({
                    message: "Old password should be different from new password",
                    success: false,
                    data: [],
                });
            } else {
                var encryptedPassword = md5(req.body.new_password);
                User.findByIdAndUpdate(
                    conditions,
                    { password: encryptedPassword },
                    { useFindAndModify: false }
                )
                    .then((data) => {
                        // console.log(data);
                        if (!data) {
                            res.status(400).send({
                                message: "Your password is not reset",
                                success: false,
                                data: [],
                            });
                        } else {
                            res.status(200).send({
                                success: true,
                                data: [],
                                message: "Password is reset successfully",
                            });
                        }
                    })
                    .catch((err) => {
                        res.status(400).send({
                            success: false,
                            data: [],
                            message: "User is not exist",
                        });
                    });
            }
        } else {
            res.status(200).send({
                success: false,
                data: [],
                message: "Old password is wrong",
            });
        }
    } else {
        res.status(401).send({
            success: false,
            data: {},
            message: "You are not authorized",
        });
    }
}

exports.updateProfile = async (req, res) => {
    if (req.user && !req.error) {
        if (req.body.user_name) {

            await User.findByIdAndUpdate(req.user.id, req.body)
                .then(async (datas) => {
                    await User.findOne({ _id: req.user.id }, { password: 0 })
                        .lean()
                        .then(async (data) => {
                            sendResponse(res, 200, true, data, "Updated successfully");
                        })
                })
        } else {
            sendResponse(res, 400, false, {}, "Missing parameters");
        }
    }
}

exports.dashboard = async (req, res) => {
    if (req.user && !req.error) {
        const { firm_id, year_id } = req.body
        if (firm_id && year_id) {
            try {
                const currentDate = new Date();
                const month = currentDate.getMonth() + 1;
                let EmployeeCount = await Employee.countDocuments({ firm_id, deleted: false });

                const MonthEarning = await Earning.find({ firm_id, month, year_id, deleted: false });
                let totalEarning = MonthEarning.reduce((total, earning) => {
                    return total + earning.amount;
                }, 0);

                const OtherDeduction = await Deduction.find({ firm_id, month, year_id, type: { $not: { $regex: "loan", $options: "i" } }, deleted: false });
                let totalOtherDeduction = OtherDeduction.reduce((total, deduction) => {
                    return total + deduction.amount;
                }, 0);

                const LoanDeduction = await Deduction.find({ firm_id, month, year_id, type: { $regex: /loan/i }, deleted: false });
                let totalLoanDeduction = LoanDeduction.reduce((total, deduction) => {
                    return total + deduction.amount;
                }, 0);

                const todayDate = new Date();
                const TodayYear = todayDate.getFullYear();
                const TodayMonth = todayDate.getMonth() + 1; // Month is zero-based, so add 1
                const TodayDay = todayDate.getDate(); // Ensure two digits

                const PresentCount = await DailyAttendance.countDocuments({
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$date" }, TodayYear] },
                            { $eq: [{ $month: "$date" }, TodayMonth] }, // MongoDB months are 0-indexed
                            { $eq: [{ $dayOfMonth: "$date" }, TodayDay] }
                        ]
                    },
                    is_present: true
                });

                const AbsentCount = await DailyAttendance.countDocuments({
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$date" }, TodayYear] },
                            { $eq: [{ $month: "$date" }, TodayMonth] }, // MongoDB months are 0-indexed
                            { $eq: [{ $dayOfMonth: "$date" }, TodayDay] }
                        ]
                    },
                    is_present: false
                });

                let data = {};
                data.total_employee = EmployeeCount;
                data.total_earning = totalEarning;
                data.total_other_deduction = totalOtherDeduction;
                data.total_loan_deduction = totalLoanDeduction;
                data.today_present = PresentCount;
                data.today_absent = AbsentCount;


                sendResponse(res, 200, true, data, "Data found successfully.")
            } catch (error) {
                sendResponse(res, 500, false, {}, "Something went wrong")
            }
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized");
    }
}

exports.storeDashboard = async (req, res) => {
    if (req.user && !req.error) {
        const { firm_id, year_id } = req.body
        if (firm_id && year_id) {
            try {
                let totalOrders = (await Orders.find({ deleted: false })).length;
                let purchaseOrders = (await Orders.find({ tag: 1, deleted: false })).length;
                let saleOrders = (await Orders.find({ tag: 2, deleted: false })).length;
                let totalInventory = (await InventoryLocation.find({ status: true })).length;
                let totalItems = (await Items.find({ status: true, deleted: false })).length;
                let totalProjects = (await Projects.find({ status: true, deleted: false })).length;
                let totalParties = (await Party.find({ status: true, deleted: false })).length;
                let totalTransports = (await Transports.find({ status: true, deleted: false })).length;
                // let totalItemStocks = await ItemStocks.find({ deleted: false }, { item: 1, quantity: 1 }).populate('item', 'name')

                let data = {};

                data.total_sales = saleOrders;
                data.total_purchase = purchaseOrders;
                data.total_orders = totalOrders;
                data.total_items = totalItems;
                data.total_inventories = totalInventory;
                data.total_projects = totalProjects;
                data.total_parties = totalParties;
                data.total_transports = totalTransports;
                // data.ItemStocks = totalItemStocks;
                sendResponse(res, 200, true, data, "Dashboard found successfully")

            } catch (error) {
                sendResponse(res, 500, false, {}, "Something went wrong" + error)
            }
        } else {
            sendResponse(res, 400, false, {}, "Missing parameters");
        }
    } else {
        sendResponse(res, 401, false, {}, "Unauthorized");
    }
}

const getTotalAssemblyWeight = async (collection, matchObj, qtyField, project) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return await collection.aggregate([
        { $match: matchObj },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "erp-drawing-grids",
                localField: "items.grid_id",
                foreignField: "_id",
                as: "gridDetails"
            }
        },
        { $unwind: "$gridDetails" },
        {
            $lookup: {
                from: "erp-drawing-grid-items",
                let: { drawingId: "$items.drawing_id", gridId: "$items.grid_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$drawing_id", "$$drawingId"] },
                                    { $eq: ["$grid_id", "$$gridId"] },
                                ]
                            }
                        }
                    }
                ],
                as: "gridItemDetails"
            }
        },
        { $unwind: { path: "$gridItemDetails", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                totalAssemblyWeight: {
                    $multiply: [`$gridItemDetails.assembly_weight`, `$items.${qtyField}`]
                },
                totalAsm: {
                    $multiply: ["$gridItemDetails.assembly_surface_area", `$items.${qtyField}`]
                }
            }
        },
        {
            $lookup: {
                from: "erp-planner-drawings",
                localField: "items.drawing_id",
                foreignField: "_id",
                as: "drawingDetails"
            }
        },
        {
            $addFields: {
                drawingDetails: { $arrayElemAt: ['$drawingDetails', 0] }
            }
        },
        { $match: { "drawingDetails.project": new ObjectId(project) } },
        {
            $facet: {
                lastDay: [
                    { $match: { createdAt: { $gte: yesterday, $lt: today } } },
                    {
                        $group: {
                            _id: null,
                            totalAssemblyWeight: { $sum: "$totalAssemblyWeight" },
                            totalAsm: { $sum: "$totalAsm" }
                        }
                    }
                ],
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalAssemblyWeight: { $sum: "$totalAssemblyWeight" },
                            totalAsm: { $sum: "$totalAsm" }
                        }
                    }
                ]
            }
        }
    ]);
};

const getAggregationData = async (model, matchObj, project, qtyField) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return await model.aggregate([
        { $match: matchObj },
        { $unwind: "$items" },
        { $match: { "items.is_accepted": true } },
        {
            $lookup: {
                from: "erp-drawing-grid-items",
                localField: "items.grid_item_id",
                foreignField: "_id",
                as: "gridItemDetails"
            }
        },
        { $unwind: "$gridItemDetails" },
        {
            $addFields: {
                totalAssemblyWeight: { $multiply: ["$gridItemDetails.assembly_weight", `$items.${qtyField}`] }
            }
        },
        {
            $lookup: {
                from: "erp-planner-drawings",
                localField: "items.drawing_id",
                foreignField: "_id",
                as: "drawingDetails"
            }
        },
        {
            $addFields: {
                drawingDetails: { $arrayElemAt: ['$drawingDetails', 0] }
            }
        },
        { $match: { "drawingDetails.project": new ObjectId(project) } },
        {
            $facet: {
                lastDay: [
                    { $match: { createdAt: { $gte: yesterday, $lt: today } } },
                    {
                        $group: {
                            _id: null,
                            totalAssemblyWeight: { $sum: "$totalAssemblyWeight" }
                        }
                    }
                ],
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalAssemblyWeight: { $sum: "$totalAssemblyWeight" }
                        }
                    }
                ]
            }
        }
    ]);
};

const getNdtAggregationData = async (model, matchObj, project, qtyField) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return await model.aggregate([
        { $match: matchObj },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "erp-drawing-grid-items",
                localField: "items.grid_item_id",
                foreignField: "_id",
                as: "gridItemDetails"
            }
        },
        { $unwind: "$gridItemDetails" },
        {
            $addFields: {
                totalAssemblyWeight: { $multiply: ["$gridItemDetails.assembly_weight", `$items.${qtyField}`] }
            }
        },
        {
            $lookup: {
                from: "erp-planner-drawings",
                localField: "items.drawing_id",
                foreignField: "_id",
                as: "drawingDetails"
            }
        },
        {
            $addFields: {
                drawingDetails: { $arrayElemAt: ['$drawingDetails', 0] }
            }
        },
        { $match: { "drawingDetails.project": new ObjectId(project) } },
        {
            $facet: {
                lastDay: [
                    { $match: { createdAt: { $gte: yesterday, $lt: today } } },
                    {
                        $group: {
                            _id: null,
                            totalAssemblyWeight: { $sum: "$totalAssemblyWeight" }
                        }
                    }
                ],
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalAssemblyWeight: { $sum: "$totalAssemblyWeight" }
                        }
                    }
                ]
            }
        }
    ]);
};

exports.pmsStore = async (req, res) => {
    const { project } = req.body;
    if (!req.user && req.error) {
        return sendResponse(res, 401, false, {}, "Unauthorized");
    }
    if (!project) {
        return sendResponse(res, 400, false, {}, "Missing parameters");
    }
    try {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const matchObj = { deleted: false, project: new ObjectId(project) };
        const matchObj3 = { deleted: false, status: { $ne: 1 } }
        const matchObj2 = { deleted: false, status: { $nin: [1, 3] } }

        const paintObj = { deleted: false, status: { $nin: [1, 4] } }

        const aggregation = await Drawing.aggregate([
            {
                $match: matchObj,
            },
            {
                $facet: {
                    lastDay: [
                        { $match: { createdAt: { $gte: yesterday, $lt: today } } },
                        { $count: "count" }
                    ],
                    overall: [
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const issueAggregation = await MultiIssueAcc.aggregate([
            {
                $match: { deleted: false, status: { $nin: [1, 3] } }
            },
            {
                $unwind: "$items"
            },
            { $match: { "items.is_accepted": true } },
            {
                $lookup: {
                    from: "erp-drawing-grid-items",
                    localField: "items.grid_item_id",
                    foreignField: "_id",
                    as: "gridItemDetails"
                }
            },
            { $unwind: "$gridItemDetails" },
            {
                $addFields: {
                    totalAssemblyWeight: { $multiply: ["$gridItemDetails.assembly_weight", "$items.iss_used_grid_qty"] }
                }
            },
            {
                $lookup: {
                    from: "erp-planner-drawings",
                    localField: "items.drawing_id",
                    foreignField: "_id",
                    as: "drawing"
                }
            },
            {
                $addFields: {
                    drawing: { $arrayElemAt: ['$drawing', 0] },
                },
            },
            {
                $match: { "drawing.project": new ObjectId(project) }
            },
            {
                $facet: {
                    lastDay: [
                        { $match: { createdAt: { $gte: yesterday, $lt: today } } },
                        {
                            $group: {
                                _id: null,
                                totalMultiplyIssQty: { $sum: { $ifNull: ["$totalAssemblyWeight", 0] } }
                            }
                        }
                    ],
                    overall: [
                        {
                            $group: {
                                _id: null,
                                totalMultiplyIssQty: { $sum: { $ifNull: ["$totalAssemblyWeight", 0] } }
                            }
                        }
                    ]
                }
            }
        ]);

        const fitupAcc = await getAggregationData(MultiFitupAcc, matchObj2, project, "fitOff_used_grid_qty");
        const weldVisualAcc = await getAggregationData(MultiWeldAcc, matchObj2, project, "weld_used_grid_qty");
        const ndtData = await getNdtAggregationData(MultiNdtAcc, matchObj3, project, "ndt_used_grid_qty");

        const fdAcc = await getTotalAssemblyWeight(finalDimensionAcc, matchObj2, "fd_used_grid_qty", project);
        const dispatchNoteAcc = await getTotalAssemblyWeight(DispatchNoteAcc, matchObj2, "dispatch_used_grid_qty", project);
        const surfacePaintAcc = await getTotalAssemblyWeight(SurafcePaint, paintObj, "surface_used_grid_qty", project);
        const mioPaintAcc = await getTotalAssemblyWeight(MioPaint, paintObj, "mio_used_grid_qty", project);
        const finalCoatPaintAcc = await getTotalAssemblyWeight(FinalCoatPaint, paintObj, "fc_used_grid_qty", project);

        const packingAcc = await MultiPackingList.aggregate([
            {
                $match: { deleted: false }
            },
            {
                $unwind: "$items"
            },
            {
                $lookup: {
                    from: "erp-drawing-grids",
                    localField: "items.grid_id",
                    foreignField: "_id",
                    as: "gridDetails"
                }
            },
            {
                $unwind: "$gridDetails"
            },
            {
                $lookup: {
                    from: "erp-drawing-grid-items",
                    let: { drawingId: "$items.drawing_id", gridId: "$items.grid_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$drawing_id", "$$drawingId"] },
                                        { $eq: ["$grid_id", "$$gridId"] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "gridItemDetails"
                }
            },
            {
                $unwind: { path: "$gridItemDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    totalAssemblyWeight: {
                        $multiply: ["$gridItemDetails.assembly_weight", "$items.rn_used_grid_qty"]
                    },
                    totalAsm: {
                        $multiply: ["$gridItemDetails.assembly_surface_area", `$items.rn_used_grid_qty`]
                    }
                }
            },
            {
                $lookup: {
                    from: "erp-planner-drawings",
                    localField: "items.drawing_id",
                    foreignField: "_id",
                    as: "drawingDetails"
                }
            },
            {
                $addFields: {
                    drawingDetails: { $arrayElemAt: ['$drawingDetails', 0] }
                }
            },
            {
                $match: { "drawingDetails.project": new ObjectId(project) }
            },
            {
                $facet: {
                    lastDay: [
                        { $match: { createdAt: { $gte: yesterday, $lt: today } } },
                        {
                            $group: {
                                _id: null,
                                totalAssemblyWeight: { $sum: "$totalAssemblyWeight" },
                                totalAsm: { $sum: "$totalAsm" }
                            }
                        }
                    ],
                    overall: [
                        {
                            $group: {
                                _id: null,
                                totalAssemblyWeight: { $sum: "$totalAssemblyWeight" },
                                totalAsm: { $sum: "$totalAsm" }
                            }
                        }
                    ]
                }
            }
        ]);

        const getValue = (data, key, field) => parseFloat((data?.[0]?.[key]?.[0]?.[field] ?? 0).toFixed(2));

        const dataMappings = [
            { name: "Count", data: aggregation, field: "count" },
            { name: "MultiplyIssQty", data: issueAggregation, field: "totalMultiplyIssQty" },
            { name: "Fitup", data: fitupAcc, field: "totalAssemblyWeight" },
            { name: "WeldVisual", data: weldVisualAcc, field: "totalAssemblyWeight" },
            { name: "Ndt", data: ndtData, field: "totalAssemblyWeight" },
            { name: "Fd", data: fdAcc, field: "totalAssemblyWeight" },
            { name: "Dn", data: dispatchNoteAcc, field: "totalAssemblyWeight", asmField: "totalAsm" },
            { name: "Surface", data: surfacePaintAcc, field: "totalAssemblyWeight", asmField: "totalAsm" },
            { name: "Mio", data: mioPaintAcc, field: "totalAssemblyWeight", asmField: "totalAsm" },
            { name: "FinalCoat", data: finalCoatPaintAcc, field: "totalAssemblyWeight", asmField: "totalAsm" },
            { name: "Packing", data: packingAcc, field: "totalAssemblyWeight", asmField: "totalAsm" }
        ];

        // const data = Object.fromEntries(
        //     dataMappings.flatMap(({ name, data, field }) => [
        //         [`lastDay${name}`, getValue(data, "lastDay", field)],
        //         [`overall${name}`, getValue(data, "overall", field)]
        //     ])
        // );

        const data = Object.fromEntries(
            dataMappings.flatMap(({ name, data, field, asmField }) => [
                [`lastDay${name}`, getValue(data, "lastDay", field)],
                [`overall${name}`, getValue(data, "overall", field)],
                ...(asmField ? [
                    [`lastDay${name}Asm`, getValue(data, "lastDay", asmField)],
                    [`overall${name}Asm`, getValue(data, "overall", asmField)]
                ] : [])
            ])
        );

        sendResponse(res, 200, true, data, "PMS Stock");

    } catch (error) {
        sendResponse(res, 500, false, {}, "Something went wrong" + error)
    }
}

const loginUserAlert = async ({ name, userEmail, erpRole, ipAddress }) => {
    const email = 'apaddonwebtech@gmail.com';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Login Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            margin-top: 20px;
            line-height: 1.6;
            color: #333333;
        }
        .content h2 {
            color: #4CAF50;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>User Login Notification</h1>
        </div>
        <div class="content">
            <h2>Hello Admin,</h2>
            <p>The following user has successfully logged into the system:</p>
            <table>
                <tr>
                    <td><strong>User Name:</strong></td>
                    <td>${name}</td>
                </tr>
                <tr>
                    <td><strong>Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
                ${erpRole ? `
                    <tr>
                        <td><strong>ERP Role:</strong></td>
                        <td>${erpRole.name}</td>
                    </tr>
                    ` : ''}
                <tr>
                    <td><strong>Login Time:</strong></td>
                    <td>${moment().format('YYYY-MM-DD HH:mm:ss')}</td>
                </tr>
                
            </table>
            <p>If this was unexpected, please review the user's activity or take necessary action.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Addonwebtech. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`

    await sendMail("User Login", email, html).then((res) => {
        console.log('Mail sent successfully')
    }).catch((err) => {
        console.log(err, 'error');
    });
}

