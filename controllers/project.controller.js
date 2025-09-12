const Project = require("../models/project.model");
const { Types: { ObjectId } } = require('mongoose');

const { sendResponse } = require("../helper/response");
const dailyAttendance = require("../models/payroll/daily.attendance.model");

exports.getProjects = async (req, res) => {
  if (req.user && !req.error) {
    try {
      await Project.find({ status: true, deleted: false }, { deleted: 0 })
        .sort({ name: 1 })
        .populate("projectManager", "name")
        .populate({
          path: "party",
          select: "name partyGroup address address_two address_three pincode city state",
          populate: {
            path: "partyGroup",
            select: "name",
          },
        })
        .populate("department", "name")
        .populate("location", "name")
        .populate("firm_id", "name gst_no")
        .populate("contractor.conId", "name email mobile status")
        .populate("year_id", "start_year  end_year")
        .sort({ voucher_no: -1 })
        .then((data) => {
          if (data) sendResponse(res, 200, true, data, "Project List");
          else sendResponse(res, 200, true, {}, "Project not found");
        });
    } catch (error) {
      console.log(error, 'Project')
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 400, false, {}, "Unauthorised");
  }
};

exports.getAdminProjects = async (req, res) => {
  if (req.user && !req.error) {
    try {
      await Project.find({ deleted: false }, { deleted: 0 })
        .populate("projectManager", "name")
        .populate({
          path: "party",
          select: "name partyGroup",
          populate: {
            path: "partyGroup",
            select: "name",
          },
        })
        .populate("department", "name")
        .populate("location", "name")
        .populate("contractor.conId", "name email mobile status")
        .populate("firm_id", "name gst_no")
        .populate("year_id", "start_year  end_year")
        .sort({ voucher_no: -1 })
        .then((data) => {
          if (data) sendResponse(res, 200, true, data, "Project List");
          else sendResponse(res, 200, true, {}, "Project not found");
        });
    } catch (error) {
      console.log(error, 'Project == 2')
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 400, false, {}, "Unauthorised");
  }
};

exports.manageProject = async (req, res) => {
  const {
    firm_id,
    year_id,
    name,
    details,
    location,
    label,
    startDate,
    endDate,
    department,
    projectManager,
    party,
    status,
    work_order_no,
    contractor,
    po_date,
    id,
  } = req.body;

  if (req.user) {
    if (
      firm_id &&
      year_id &&
      name &&
      location &&
      // department &&
      projectManager &&
      work_order_no &&
      po_date &&
      party
    ) {
      const conData = contractor && JSON.parse(contractor);
      const depart = department === "" || department === "undefined" ? null : department;

      const lastProject = await Project.findOne({}).sort({ voucher_no: -1 });
      const new_voucher_no = lastProject ? parseInt(lastProject.voucher_no) + 1 : 10001;

      const ProjectObject = new Project({
        firm_id,
        year_id,
        name: name,
        details: details,
        location: location,
        label: label,
        startDate: startDate ? startDate : null,
        endDate: endDate ? endDate : null,
        department: depart,
        projectManager: projectManager,
        work_order_no: work_order_no,
        party: party,
        contractor: conData,
        voucher_no: new_voucher_no,
        po_date: po_date,
      });

      if (!id) {
        try {
          await ProjectObject.save(ProjectObject).then((data) => {
            sendResponse(res, 200, true, {}, "Project added successfully");
          });
        } catch (error) {
          sendResponse(res, 500, false, {}, "Something went wrong");
        }
      } else {
        await Project.findByIdAndUpdate(id, {
          firm_id,
          year_id,
          name: name,
          details: details,
          location: location,
          label: label,
          startDate: startDate !== "Invalid date" ? startDate : null,
          endDate: endDate !== "Invalid date" ? endDate : null,
          department: depart,
          projectManager: projectManager,
          party: party,
          work_order_no: work_order_no,
          status: status,
          contractor: conData,
          po_date: po_date,
        }).then((data) => {
          if (data) {
            sendResponse(res, 200, true, {}, "Project updated successfully");
          } else {
            sendResponse(res, 200, true, {}, "Project not found");
          }
        });
      }
    } else {
      sendResponse(res, 400, false, {}, "Missing parameters");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.body;
  if (req.user && !req.error && id) {
    try {
      await Project.findByIdAndUpdate(id, { deleted: true }).then((data) => {
        if (data) {
          sendResponse(res, 200, true, {}, "Project deleted successfully");
        }
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.getOneProject = async (req, res) => {
  const { pId } = req.params
  if (!req.user && req.error) {
    return sendResponse(res, 401, false, {}, "Unauthorized");
  }

  if (!pId) {
    return sendResponse(res, 400, false, {}, "Missing parameters");
  }

  try {

    await Project.findById(pId, { deleted: 0 })
      .populate({
        path: "party",
        select: "name partyGroup address pincode city state gstNumber",
        populate: {
          path: "partyGroup",
          select: "name",
        },
      })

      .then(data => {
        if (!data) {
          sendResponse(res, 200, true, {}, "Project not found")
        } else {
          sendResponse(res, 200, true, data, "Project found")
        }
      })
  } catch (error) {
    console.log(error)
    sendResponse(res, 500, false, {}, "Something went wrong")
  }
}

const projectIncomeExpense = async () => {
  try {
    const requestData = await Project.aggregate([
      {
        $match: { deleted: false },
      },
      {
        $lookup: {
          from: "erp-requests",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$project", "$$projectId"] },
                deleted: false
              }
            },
            {
              $lookup: {
                from: "erp-purchase-offers",
                let: { requestId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$requestId", "$$requestId"] },
                      deleted: false
                    }
                  },
                  { $unwind: "$items" },
                  {
                    $lookup: {
                      from: "store_transaction_items",
                      let: { txnId: "$items.transactionId" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$txnId"] },
                            deleted: false
                          }
                        }
                      ],
                      as: "items.transactionItemData"
                    }
                  },
                  {
                    $unwind: {
                      path: "$items.transactionItemData",
                      preserveNullAndEmptyArrays: true
                    }
                  },
                  {
                    $addFields: {
                      item_cost: {
                        $multiply: [
                          { $ifNull: ["$items.offeredQty", 0] },
                          { $ifNull: ["$items.transactionItemData.unit_rate", 0] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: "$requestId",
                      total_expense: { $sum: "$item_cost" },
                      items: { $push: "$items" }
                    }
                  }
                ],
                as: "purchaseDetails"
              }
            }
          ],
          as: "requestDetails"
        }
      },
      {
        $lookup: {
          from: "ms_trans_details",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project_id", "$$projectId"] },
                    { $eq: ["$tag_id", new ObjectId("66ab65d0bf00a1d95bb7fef4")] }
                  ]
                },
                deleted: false
              }
            },
            { $unwind: "$items_details" },
            {
              $match: {
                "items_details.deleted": false
              }
            },
            {
              $group: {
                _id: null,
                total_store_expense: {
                  $sum: { $ifNull: ["$items_details.total_amount", 0] }
                }
              }
            }
          ],
          as: "storeExpense"
        }
      },
      {
        $lookup: {
          from: "multi-erp-invoices",
          let: { project_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$projectId", "$$project_id"]
                },
              }
            },
            {
              $group: {
                _id: null,
                total_income: {
                  $sum: { $ifNull: ["$netAmount", 0] }
                }
              }
            }
          ],
          as: "storeInvoice"
        }
      },
      {
        $addFields: {
          requestDetails: { $arrayElemAt: ["$requestDetails", 0] }
        }
      },
      {
        $addFields: {
          purchaseDetails: { $arrayElemAt: ["$requestDetails.purchaseDetails", 0] }
        }
      },
      {
        $addFields: {
          total_income: {
            $ifNull: [{ $arrayElemAt: ["$storeInvoice.total_income", 0] }, 0]
          },
          project_material_expense: {
            $ifNull: ["$purchaseDetails.total_expense", 0],
          },
          project_store_expense: {
            $ifNull: [{ $arrayElemAt: ["$storeExpense.total_store_expense", 0] }, 0]
          }
        },
      },
      {
        $project: {
          _id: 0,
          project_id: "$_id",
          project_name: "$name",
          total_income: 1,
          project_material_expense: 1,
          project_store_expense: 1,
        },
      },
    ]);

    const requestData1 = await dailyAttendance.aggregate([
      {
        $match: {
          deleted: false,
          project: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: "bussiness-projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails"
        }
      },
      {
        $unwind: {
          path: "$projectDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "salaries",
          let: { employeeId: "$employee", month: "$month", firm_id: "$firm_id", year_id: "$year_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$month", "$$month"] },
                    { $eq: ["$firm_id", "$$firm_id"] },
                    { $eq: ["$year_id", "$$year_id"] }
                  ]
                }
              }
            }
          ],
          as: "salaryDetails"
        }
      },
      {
        $unwind: {
          path: "$salaryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "earnings",
          let: { employeeId: "$employee", month: "$month", date: "$date", firm_id: "$firm_id", year_id: "$year_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$firm_id", "$$firm_id"] },
                    { $eq: ["$year_id", "$$year_id"] },
                    { $eq: ["$month", "$$month"] },
                    { $eq: ["$date", "$$date"] },
                    { $eq: ["$deleted", false] }
                  ]
                }
              }
            }
          ],
          as: "earningsDetails"
        }
      },
      {
        $unwind: {
          path: "$earningsDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            project_id: "$project",
            project_name: "$projectDetails.name",
            date: "$date"
          },
          total_salary: {
            $sum: {
              $round: [
                {
                  $add: [
                    { $multiply: ["$present_day", "$salaryDetails.perday_salary"] },
                    { $multiply: ["$ot_hour", "$salaryDetails.perhour_ot_salary"] }
                  ]
                },
                2
              ]
            }
          },
          total_earnings: { $sum: "$earningsDetails.amount" }
        }
      },
      {
        $group: {
          _id: {
            project_id: "$_id.project_id",
            project_name: "$_id.project_name"
          },
          salary_by_date: {
            $push: {
              date: "$_id.date",
              total_salary: { $add: ["$total_salary", "$total_earnings"] }
            }
          }
        }
      },
      {
        $addFields: {
          total_project_salary: {
            $sum: {
              $map: {
                input: "$salary_by_date",
                as: "s",
                in: "$$s.total_salary"
              }
            }
          }
        }
      },
      {
        $sort: {
          "_id.project_name": 1
        }
      },
      {
        $project: {
          _id: 0,
          project_id: "$_id.project_id",
          project_name: "$_id.project_name",
          project_salary_expense: "$total_project_salary"
        }
      }
    ]);

    const mergedMap = new Map();

    requestData.forEach(item => {
      const key = `${item.project_id}_${item.project_name}`;
      mergedMap.set(key, { ...item, project_salary_expense: 0 });
    });

    requestData1.forEach(item => {
      const key = `${item.project_id}_${item.project_name}`;
      if (mergedMap.has(key)) {
        mergedMap.set(key, { ...mergedMap.get(key), ...item });
      } else {
        mergedMap.set(key, { ...item, some_other_field: 0 });
      }
    });

    const mergedData = Array.from(mergedMap.values());



    if (mergedData.length && mergedData.length > 0) {
      return { status: 1, result: mergedData };
    } else {
      return { status: 0, result: [] };
    }
  } catch (error) {
    return { status: 2, result: error };
  }
};

exports.getProjectIncomeExpense = async (req, res) => {
  if (req.user && !req.error) {
    try {
      const data = await projectIncomeExpense();
      let requestData = data.result;

      if (data.status === 1) {
        sendResponse(res, 200, true, requestData, `Project income expense data list`);
      } else if (data.status === 0) {
        sendResponse(res, 200, true, [], `Project income expense data not found`);
      } else if (data.status === 2) {
        console.log("errrrrr", data.result)
        sendResponse(res, 500, false, {}, "Something went wrong11");
      }
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

const projectCurruentMonth = async (year_id) => {
  try {

    const requestData = await Project.aggregate([
      {
        $match: { deleted: false },
      },
      {
        $lookup: {
          from: "erp-requests",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$project", "$$projectId"] },
                deleted: false
              }
            },
            {
              $lookup: {
                from: "erp-purchase-offers",
                let: { requestId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$requestId", "$$requestId"] },
                          { $eq: [{ $month: "$received_date" }, { $month: "$$NOW" }] },
                          { $eq: [{ $year: "$received_date" }, { $year: "$$NOW" }] }
                        ]
                      },
                      deleted: false
                    }
                  },
                  { $unwind: "$items" },
                  {
                    $lookup: {
                      from: "store_transaction_items",
                      let: { txnId: "$items.transactionId" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$txnId"] },
                            deleted: false
                          }
                        }
                      ],
                      as: "items.transactionItemData"
                    }
                  },
                  {
                    $unwind: {
                      path: "$items.transactionItemData",
                      preserveNullAndEmptyArrays: true
                    }
                  },
                  {
                    $addFields: {
                      item_cost: {
                        $multiply: [
                          { $ifNull: ["$items.offeredQty", 0] },
                          { $ifNull: ["$items.transactionItemData.unit_rate", 0] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: "$requestId",
                      total_expense: { $sum: "$item_cost" },
                      items: { $push: "$items" }
                    }
                  }
                ],
                as: "purchaseDetails"
              }
            }
          ],
          as: "requestDetails"
        }
      },
      {
        $lookup: {
          from: "ms_trans_details",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project_id", "$$projectId"] },
                    { $eq: ["$tag_id", new ObjectId("66ab65d0bf00a1d95bb7fef4")] },
                    { $eq: [{ $month: "$trans_date" }, { $month: "$$NOW" }] },
                    { $eq: [{ $year: "$trans_date" }, { $year: "$$NOW" }] }
                  ]
                },
                deleted: false
              }
            },
            { $unwind: "$items_details" },
            {
              $match: {
                "items_details.deleted": false
              }
            },
            {
              $group: {
                _id: null,
                total_store_expense: {
                  $sum: { $ifNull: ["$items_details.total_amount", 0] }
                }
              }
            }
          ],
          as: "storeExpense"
        }
      },
      {
        $lookup: {
          from: "multi-erp-invoices",
          let: { project_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$projectId", "$$project_id"] },
                    { $eq: [{ $month: "$invoiceDate" }, { $month: "$$NOW" }] },
                    { $eq: [{ $year: "$invoiceDate" }, { $year: "$$NOW" }] }
                  ]
                },
              }
            },

            {
              $group: {
                _id: null,
                total_income: {
                  $sum: { $ifNull: ["$netAmount", 0] }
                }
              }
            }
          ],
          as: "storeInvoice"
        }
      },
      {
        $addFields: {
          requestDetails: { $arrayElemAt: ["$requestDetails", 0] }
        }
      },
      {
        $addFields: {
          purchaseDetails: { $arrayElemAt: ["$requestDetails.purchaseDetails", 0] }
        }
      },
      {
        $addFields: {
          total_income: {
            $ifNull: [{ $arrayElemAt: ["$storeInvoice.total_income", 0] }, 0]
          },
          project_material_expense: {
            $ifNull: ["$purchaseDetails.total_expense", 0],
          },
          project_store_expense: {
            $ifNull: [{ $arrayElemAt: ["$storeExpense.total_store_expense", 0] }, 0]
          }
        },
      },
      {
        $project: {
          _id: 0,
          project_id: "$_id",
          project_name: "$name",
          total_income: 1,
          project_material_expense: 1,
          project_store_expense: 1,
        },
      },
    ]);

    const requestData1 = await dailyAttendance.aggregate([
      {
        $match: {
          deleted: false,
          project: { $exists: true, $ne: null },
          year_id: new ObjectId(year_id),
          $expr: {
            $eq: ["$month", { $month: "$$NOW" }]
          }
        }
      },
      {
        $lookup: {
          from: "bussiness-projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails"
        }
      },
      {
        $unwind: {
          path: "$projectDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "salaries",
          let: { employeeId: "$employee", month: "$month", firm_id: "$firm_id", year_id: "$year_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$month", "$$month"] },
                    { $eq: ["$firm_id", "$$firm_id"] },
                    { $eq: ["$year_id", "$$year_id"] }
                  ]
                }
              }
            }
          ],
          as: "salaryDetails"
        }
      },
      {
        $unwind: {
          path: "$salaryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "earnings",
          let: { employeeId: "$employee", month: "$month", date: "$date", firm_id: "$firm_id", year_id: "$year_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$firm_id", "$$firm_id"] },
                    { $eq: ["$year_id", "$$year_id"] },
                    { $eq: ["$month", "$$month"] },
                    { $eq: ["$date", "$$date"] },
                    { $eq: ["$deleted", false] }
                  ]
                }
              }
            }
          ],
          as: "earningsDetails"
        }
      },
      {
        $unwind: {
          path: "$earningsDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            project_id: "$project",
            project_name: "$projectDetails.name",
            date: "$date"
          },
          total_salary: {
            $sum: {
              $round: [
                {
                  $add: [
                    { $multiply: ["$present_day", "$salaryDetails.perday_salary"] },
                    { $multiply: ["$ot_hour", "$salaryDetails.perhour_ot_salary"] }
                  ]
                },
                2
              ]
            }
          },
          total_earnings: { $sum: "$earningsDetails.amount" }
        }
      },
      {
        $group: {
          _id: {
            project_id: "$_id.project_id",
            project_name: "$_id.project_name"
          },
          salary_by_date: {
            $push: {
              date: "$_id.date",
              total_salary: { $add: ["$total_salary", "$total_earnings"] }
            }
          }
        }
      },
      {
        $addFields: {
          total_project_salary: {
            $sum: {
              $map: {
                input: "$salary_by_date",
                as: "s",
                in: "$$s.total_salary"
              }
            }
          }
        }
      },
      {
        $sort: {
          "_id.project_name": 1
        }
      },
      {
        $project: {
          _id: 0,
          project_id: "$_id.project_id",
          project_name: "$_id.project_name",
          project_salary_expense: "$total_project_salary"
        }
      }
    ]);

    const mergedMap = new Map();

    requestData.forEach(item => {
      const key = `${item.project_id}_${item.project_name}`;
      mergedMap.set(key, { ...item, project_salary_expense: 0 });
    });

    requestData1.forEach(item => {
      const key = `${item.project_id}_${item.project_name}`;
      if (mergedMap.has(key)) {
        mergedMap.set(key, { ...mergedMap.get(key), ...item });
      } else {
        mergedMap.set(key, { ...item, some_other_field: 0 });
      }
    });

    const mergedData = Array.from(mergedMap.values());



    if (mergedData.length && mergedData.length > 0) {
      return { status: 1, result: mergedData };
    } else {
      return { status: 0, result: [] };
    }
  } catch (error) {
    return { status: 2, result: error };
  }
};

exports.getProjectCurruentMonth = async (req, res) => {
  const { year_id } = req.body
  if (req.user && !req.error) {
    try {
      const data = await projectCurruentMonth(year_id);
      let requestData = data.result;

      if (data.status === 1) {
        sendResponse(res, 200, true, requestData, `Project income expense data list`);
      } else if (data.status === 0) {
        sendResponse(res, 200, true, [], `Project income expense data not found`);
      } else if (data.status === 2) {
        console.log("errrrrr", data.result)
        sendResponse(res, 500, false, {}, "Something went wrong11");
      }
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

const projectLastDate = async (year_id) => {
  try {

    function getYesterdayDateFormatted() {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date.toISOString().split("T")[0];
    }

    const yesterdayDate = getYesterdayDateFormatted();

    function getYesterdayDay() {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date.getDate();
    }

    const yesterdayDay = getYesterdayDay();

    const requestData = await Project.aggregate([
      {
        $match: { deleted: false },
      },
      {
        $lookup: {
          from: "erp-requests",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$project", "$$projectId"] },
                deleted: false
              }
            },
            {
              $lookup: {
                from: "erp-purchase-offers",
                let: { requestId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$requestId", "$$requestId"] },
                          { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$received_date" } }, yesterdayDate] }
                        ]
                      },
                      deleted: false
                    }
                  },
                  { $unwind: "$items" },
                  {
                    $lookup: {
                      from: "store_transaction_items",
                      let: { txnId: "$items.transactionId" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$txnId"] },
                            deleted: false
                          }
                        }
                      ],
                      as: "items.transactionItemData"
                    }
                  },
                  {
                    $unwind: {
                      path: "$items.transactionItemData",
                      preserveNullAndEmptyArrays: true
                    }
                  },
                  {
                    $addFields: {
                      item_cost: {
                        $multiply: [
                          { $ifNull: ["$items.offeredQty", 0] },
                          { $ifNull: ["$items.transactionItemData.unit_rate", 0] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: "$requestId",
                      total_expense: { $sum: "$item_cost" },
                      items: { $push: "$items" }
                    }
                  }
                ],
                as: "purchaseDetails"
              }
            }
          ],
          as: "requestDetails"
        }
      },
      {
        $lookup: {
          from: "ms_trans_details",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project_id", "$$projectId"] },
                    { $eq: ["$tag_id", new ObjectId("66ab65d0bf00a1d95bb7fef4")] },
                    { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$trans_date" } }, yesterdayDate] }
                  ]
                },
                deleted: false
              }
            },
            { $unwind: "$items_details" },
            {
              $match: {
                "items_details.deleted": false
              }
            },
            {
              $group: {
                _id: null,
                total_store_expense: {
                  $sum: { $ifNull: ["$items_details.total_amount", 0] }
                }
              }
            }
          ],
          as: "storeExpense"
        }
      },
      {
        $lookup: {
          from: "multi-erp-invoices",
          let: { project_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$projectId", "$$project_id"] },
                    { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } }, yesterdayDate] }
                  ]
                },
              }
            },

            {
              $group: {
                _id: null,
                total_income: {
                  $sum: { $ifNull: ["$netAmount", 0] }
                }
              }
            }
          ],
          as: "storeInvoice"
        }
      },
      {
        $addFields: {
          requestDetails: { $arrayElemAt: ["$requestDetails", 0] }
        }
      },
      {
        $addFields: {
          purchaseDetails: { $arrayElemAt: ["$requestDetails.purchaseDetails", 0] }
        }
      },
      {
        $addFields: {
          total_income: {
            $ifNull: [{ $arrayElemAt: ["$storeInvoice.total_income", 0] }, 0]
          },
          project_material_expense: {
            $ifNull: ["$purchaseDetails.total_expense", 0],
          },
          project_store_expense: {
            $ifNull: [{ $arrayElemAt: ["$storeExpense.total_store_expense", 0] }, 0]
          }
        },
      },
      {
        $project: {
          _id: 0,
          project_id: "$_id",
          project_name: "$name",
          total_income: 1,
          project_material_expense: 1,
          project_store_expense: 1,
        },
      },
    ]);

    const requestData1 = await dailyAttendance.aggregate([
      {
        $match: {
          deleted: false,
          project: { $exists: true, $ne: null },
          year_id: new ObjectId(year_id),
          $expr: {
            $and: [
              { $eq: ["$month", { $month: "$$NOW" }] },
              { $eq: ["$e_day", yesterdayDay] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "bussiness-projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails"
        }
      },
      {
        $unwind: {
          path: "$projectDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "salaries",
          let: { employeeId: "$employee", month: "$month", e_day: "$e_day", firm_id: "$firm_id", year_id: "$year_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$month", "$$month"] },
                    { $eq: ["$e_day", "$$e_day"] },
                    { $eq: ["$firm_id", "$$firm_id"] },
                    { $eq: ["$year_id", "$$year_id"] }
                  ]
                }
              }
            }
          ],
          as: "salaryDetails"
        }
      },
      {
        $unwind: {
          path: "$salaryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "earnings",
          let: { employeeId: "$employee", month: "$month", date: "$date", firm_id: "$firm_id", year_id: "$year_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$firm_id", "$$firm_id"] },
                    { $eq: ["$year_id", "$$year_id"] },
                    { $eq: ["$month", "$$month"] },
                    { $eq: ["$date", "$$date"] },
                    { $eq: ["$deleted", false] }
                  ]
                }
              }
            }
          ],
          as: "earningsDetails"
        }
      },
      {
        $unwind: {
          path: "$earningsDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            project_id: "$project",
            project_name: "$projectDetails.name",
            date: "$date"
          },
          total_salary: {
            $sum: {
              $round: [
                {
                  $add: [
                    { $multiply: ["$present_day", "$salaryDetails.perday_salary"] },
                    { $multiply: ["$ot_hour", "$salaryDetails.perhour_ot_salary"] }
                  ]
                },
                2
              ]
            }
          },
          total_earnings: { $sum: "$earningsDetails.amount" }
        }
      },
      {
        $group: {
          _id: {
            project_id: "$_id.project_id",
            project_name: "$_id.project_name"
          },
          salary_by_date: {
            $push: {
              date: "$_id.date",
              total_salary: { $add: ["$total_salary", "$total_earnings"] }
            }
          }
        }
      },
      {
        $addFields: {
          total_project_salary: {
            $sum: {
              $map: {
                input: "$salary_by_date",
                as: "s",
                in: "$$s.total_salary"
              }
            }
          }
        }
      },
      {
        $sort: {
          "_id.project_name": 1
        }
      },
      {
        $project: {
          _id: 0,
          project_id: "$_id.project_id",
          project_name: "$_id.project_name",
          project_salary_expense: "$total_project_salary"
        }
      }
    ]);

    const mergedMap = new Map();

    requestData.forEach(item => {
      const key = `${item.project_id}_${item.project_name}`;
      mergedMap.set(key, { ...item, project_salary_expense: 0 });
    });

    requestData1.forEach(item => {
      const key = `${item.project_id}_${item.project_name}`;
      if (mergedMap.has(key)) {
        mergedMap.set(key, { ...mergedMap.get(key), ...item });
      } else {
        mergedMap.set(key, { ...item, some_other_field: 0 });
      }
    });

    const mergedData = Array.from(mergedMap.values());



    if (mergedData.length && mergedData.length > 0) {
      return { status: 1, result: mergedData };
    } else {
      return { status: 0, result: [] };
    }
  } catch (error) {
    return { status: 2, result: error };
  }
};

exports.getProjectLastDate = async (req, res) => {
  const { year_id } = req.body
  if (req.user && !req.error) {
    try {
      const data = await projectLastDate(year_id);
      let requestData = data.result;

      if (data.status === 1) {
        sendResponse(res, 200, true, requestData, `Project income expense data list`);
      } else if (data.status === 0) {
        sendResponse(res, 200, true, [], `Project income expense data not found`);
      } else if (data.status === 2) {
        console.log("errrrrr", data.result)
        sendResponse(res, 500, false, {}, "Something went wrong11");
      }
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};