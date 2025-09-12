const { managePermission } = require("../controllers/permission.controller");

module.exports = (app) => {
  var router = require("express").Router();

  const { userTokenValidator } = require("../helper/index");

  router.use(userTokenValidator);

  const firm = require("../controllers/firm.controller");
  const user = require("../controllers/user.controller");

  // Payroll =============================================================================

  const employee = require("../controllers/payroll/employ.controller");
  const designation = require("../controllers/payroll/designation.controller");
  const shift = require("../controllers/payroll/shift.controller");
  const workday = require("../controllers/payroll/workDay.controller");
  const department = require("../controllers/payroll/department.controller");
  const salary = require("../controllers/payroll/salary.controller");
  const bank = require("../controllers/payroll/bank.controller");
  const group = require("../controllers/payroll/group.controller");

  const monthly = require("../controllers/payroll/monthly.attendance.controller");
  const daily = require("../controllers/payroll/daily.attendance.controller");
  const holiday = require("../controllers/payroll/holiday.controller");
  const deduction = require("../controllers/payroll/deduction.controller");
  const earning = require("../controllers/payroll/earning.controller");
  const loan = require("../controllers/payroll/loan.controller");
  const authPerson = require("../controllers/payroll/auth_person.controller");
  const skill = require("../controllers/payroll/skill.controller");
  const employeeType = require("../controllers/payroll/employee_type.controller");
  const employeeLeaves = require("../controllers/payroll/leave.controller");
  const leaveEntry = require("../controllers/payroll/leave_entry.controller");

  const punchMachine = require("../controllers/punch_machine.controller");

  // Store =====================================================================

  const unit = require("../controllers/store/unit.controller");
  const itemCategory = require("../controllers/store/item_category.controller");
  const transport = require("../controllers/store/transport.controller");
  const inventoryLocation = require("../controllers/store/inventory_location.controller");
  const project = require("../controllers/project.controller");
  const party = require("../controllers/store/party.controller");

  const partyGroup = require("../controllers/store/partyGroup.controller");
  const order = require("../controllers/store/order.controller");
  const item = require("../controllers/store/item.controller");
  const stock = require("../controllers/store/item_stock.controller");

  const partyTag = require("../controllers/store/party_tag.controller");

  const orderAdjustment = require("../controllers/store/order_adjustment.controller");
  const transactionItem = require("../controllers/store/transaction_item.controller");
  const purchaseOffer = require("../controllers/store/purchase_offer.controller");
  const unitLocation = require("../controllers/main-store/unitLocation/unitLocation.controller");

  // ERP =======================================================================================
  const materialIssue = require("../controllers/erp/material_controller/issue.controller");
  // Planner ---------------------------------------------------
  const draw = require("../controllers/erp/planner/draw.controller");
  const request = require("../controllers/erp/planner/request.controller");
  const materialRequest = require("../controllers/erp/DrawingIssueMaterial/issue_request.controller");
  const materialAcceptance = require("../controllers/erp/DrawingIssueMaterial/issue_acceptance.controller");
  const fitupInspection = require("../controllers/erp/Execution/fitup_inspection.controller");
  const weldInspectionOffer = require("../controllers/erp/Execution/weld_inspection_offer.controller");
  const TestOffer = require("../controllers/erp/Testing/test_offer.controller");
  const wpsMaster = require("../controllers/store/wps.master.controller");
  // ===========================================================================================
  const jointType = require("../controllers/erp/JointType/jointType.controller");
  const ndt = require("../controllers/erp/NDT/ndt.controller");
  const ndtMaster = require("../controllers/erp/NDT/ndt_master.controller");
  const UtInspection = require("../controllers/erp/Testing/ut_test_inspection.controller");
  const RtInspection = require("../controllers/erp/Testing/rt_test_inspection.controller");
  const MptInspectionReport = require("../controllers/erp/Testing/mpt_ test_inspection.controller");
  const LptInspectionReport = require("../controllers/erp/Testing/lpt_test_inspection.controller");
  const paintingSystem = require("../controllers/erp/PaintingSystem/paintingSystem.controller");
  const contractor = require("../controllers/erp/Contractor/contractor.controller");
  const qualifiedWelder = require("../controllers/erp/QualifiedWelder/qualifiedWelder.controller");
  const ProcedureAndSpecification = require("../controllers/erp/ProcedureAndSpecification/procedure_specification.controller");

  // ===========================================================================================

  const PaintManufacturer = require("../controllers/erp/PaintManufacturer/paintManufacturer.controller");

  // Main store general
  const tag = require("../controllers/main-store/general/tag.controller");
  const master = require("../controllers/main-store/general/master.controller");

  // Main store issue return
  const transaction = require("../controllers/main-store/transaction/transaction.controller");

  // Main store stock
  const msStock = require("../controllers/main-store/stock/stock.controller");
  const createYearStockTransfer = require("../controllers/main-store/stock/yearStockTransfer.controller");
  // Manage permission
  const permission = require("../controllers/permission.controller");

  const finalDimension = require('../controllers/erp/Execution/fd_inspection_offer.controller');
  const InspectSummary = require('../controllers/erp/Execution/inspect_summary.controller');
  const DispachNote = require('../controllers/erp/ReleaseNotes/dispatchnote.controller');

  const surfacePrimer = require('../controllers/erp/Paint/surface.controller');
  const mioCtrl = require('../controllers/erp/Paint/mio.controller');
  const finalPaintCtrl = require('../controllers/erp/Paint/finalCoat.controller');
  const IRNModel = require('../controllers/erp/ReleaseNotes/inspection_release.controller');

  const Packing = require('../controllers/erp/Packing/packing.controller');
  const Invoice = require('../controllers/erp/Billing/invoice.controller');

  const ProjectLocation = require('../controllers/erp/ProjectLocation/project_location.controller');

//================DMR================================================================================
  const Dmr = require('../controllers/erp/ManResource/manresource.controller');
  const DmrCategory = require('../controllers/erp/ManResource/manresourcecategory.controller');

  
  //================Multiple drawings=================================================================
  const MultiRequest = require('../controllers/erp/Multi/multi_issue_request.controller');
  const MultiAcceptance = require("../controllers/erp/Multi/multi_issue_acceptance.controller");
  const MultiFitup = require("../controllers/erp/Multi/multi_fitup_inspection.controller");
  const Grids = require('../controllers/erp/planner/draw_grid.controller');
  const GridItem = require('../controllers/erp/planner/drawing_grid_items.controller');

  const MultiWeldVisual = require('../controllers/erp/Multi/multi_weld_visual_inspection.controller');
  const MultiNDT = require("../controllers/erp/Multi/multi_ndt_master.controller");

  const FitupOffTable = require('../controllers/erp/Multi/offer_table_data/fitup_offer_table.controller');
  const WeldVisualOfferTable = require('../controllers/erp/Multi/offer_table_data/weld_offer_table.controller');
  const NDTOfferTable = require("../controllers/erp/Multi/offer_table_data/ndt_offer_table.controller");
  const NDTTypeOfferTable = require("../controllers/erp/Multi/multi_ndt_type_offer.controller");
  const MultiFD = require('../controllers/erp/Multi/multi_fd_inspection.controller');
  const MultiInspectSummary = require('../controllers/erp/Multi/inspect_summary/multi_inspect_summary.controller');
  const MultiDispatchOffer = require('../controllers/erp/Multi/offer_table_data/dispatch_offer_table.controller');
  const MultiSurfaceOffer = require('../controllers/erp/Multi/offer_table_data/Paint/surface_offer_table.controller');
  const MultiSurfaceInspection = require('../controllers/erp/Multi/multi_surface_inspection.controller');
  const MultiMIOOffer = require('../controllers/erp/Multi/offer_table_data/Paint/mio_offer_table.controller');
  const MultiMIOInspection = require('../controllers/erp/Multi/multi_mio_inspection.controller');
  const MultiFCOffer = require('../controllers/erp/Multi/offer_table_data/Paint/final_coat_offer_table.controller');
  const MultiFCInspection = require('../controllers/erp/Multi/multi_final_coat_inspection.controller');
  const MultiDispatch = require('../controllers/erp/Multi/dispatch_note/multi_dispatch_note.controller');
  const MultiFDOfferTable = require("../controllers/erp/Multi/offer_table_data/fd_offer_table.controller");
  const MultiUtInspection = require("../controllers/erp/Multi/Testing/multi_ut_test.controller");
  const MultiRTInspection = require("../controllers/erp/Multi/Testing/multi_rt_test.controller");
  const MultiLPTInspection = require("../controllers/erp/Multi/Testing/multi_lpt_test.controller");
  const MultiMPTInspection = require("../controllers/erp/Multi/Testing/multi_mpt_test.controller");

  const MultiReleaseNote = require("../controllers/erp/Multi/release_note/multi_release_note.controller");

  const IssueOffTable = require("../controllers/erp/Multi/offer_table_data/issue_offer_table.controller");

  const PackingOffTable = require("../controllers/erp/Multi/offer_table_data/packing_offer_table.controller");
  const PackingInspection = require('../controllers/erp/Multi/packing/multi_packing.controller');

  const MultiInvoice = require("../controllers/erp/Multi/Invoice/multi_invoice.controller");
  const usableStock = require("../controllers/store/usable_stock.controller");

  const year = require("../controllers/year.controller");


  // ==============================================================================================
  router.post("/login", user.loginUser);
  router.get("/get-year", year.getYear);

  router.post("/forget-password", user.userForgetPassword);
  router.post("/verify-otp", user.userVerifyOtp);
  router.post("/reset-password", user.userResetPassword);

  router.post("/change-password", user.changesPassword);
  router.get("/get-profile", user.getUserProfile);
  router.post("/update-profile", user.updateProfile);
  router.post("/dashboard", user.dashboard);
  router.post("/store-dashboard", user.storeDashboard);

  // Payroll =======================================================
  router.patch("/salary-update", salary.updateSalary);
  router.post("/list-pt-report", salary.listPTreport);
  router.post("/pt-report-download", salary.downloadPTreport);
  router.post("/pt-report-xlsx", salary.xlsxPTreport);
  router.post("/list-n-salary-report", salary.oneNsalary);
  router.post("/n-salary-report-download", salary.downloadOneNsalary);
  router.post("/list-b-salary-report", salary.oneBsalary);
  router.post("/b-salary-report-download", salary.downloadOneBsalary);
  router.post("/b-salary-report-xlsx", salary.xlsxBsalary);
  router.post("/list-pf-report", salary.onePF);
  router.post("/pf-report-download", salary.downloadOnePF);
  router.post("/pf-report-xlsx", salary.xlsxPFreport);
  router.post("/list-yearly-salary-report", salary.oneYearlysalary);
  router.post("/yearly-salary-report-download", salary.downloadOneYearlysalary);
  router.post("/yearly-salary-report-xlsx", salary.xlsxYearlyReport);
  router.post("/list-yearly-month-report", salary.oneYearlymonthsalary);
  router.post("/yearly-month-report-download", salary.downloadOneYearlymonthsalary);
  router.post("/yearly-month-report-xlsx", salary.xlsxYearlymonthReport);
  router.post("/list-esic-report", salary.oneESIC);
  router.post("/esic-report-download", salary.downloadOneESIC);
  router.post("/esic-report-xlsx", salary.xlsxESIC);
  router.get('/get-employee', employee.getEmployee);
  router.get('/get-admin-employee', employee.getAdminEmployee);
  router.post('/manage-employee', employee.manageEmploy);
  router.delete('/delete-employee', employee.deleteEmployee);
  router.post('/employee-report', employee.EmployeeReport);
  router.post('/daily-employee-report', employee.EmployeeDailyReport);
  router.post('/department-report', employee.DepartmentSalaryReport);
  router.get('/get-employee-report', employee.GetEmployeeReport);
  router.post('/download-form-11', employee.downloadForm11);
  router.post('/download-police-station', employee.downloadPoliceForm);
  router.post('/download-gatepass', employee.downloadGatePass);
  router.get('/search-employee', employee.searchEmployee);
  router.get('/get-all-employee', employee.getAllEmployee);
  router.post('/update-employee-excel', employee.updateEmployeeByExcel)

  router.get('/list-employee-all', employee.listEmployeeAll);

  router.post('/get-attendance-register', employee.getAttendanceRegister);
  router.post('/download-xlsx-attendance-regi', employee.downloadXlsxAttendaceRegister);

  router.get("/get-designation", designation.getDesignation);
  router.get("/get-admin-designation", designation.getAdminDesignation);
  router.post("/manage-designation", designation.manageDesignation);
  router.delete("/delete-designation", designation.deleteDesignation);

  router.get("/get-department", department.getDepartment);
  router.get("/get-admin-department", department.getAdminDepartment);
  router.post("/manage-department", department.manageDepartment);
  router.delete("/delete-department", department.deleteDepartment);

  router.get("/get-shift", shift.getShift);
  router.get("/get-admin-shift", shift.getAdminShift);
  router.post("/manage-shift", shift.manageShift);
  router.delete("/delete-shift", shift.deleteShift);

  router.get("/get-firm", firm.getFirm);

  router.get("/get-workday", workday.getWorkDay);
  router.get("/get-admin-workday", workday.getAdminWorkDay);
  router.post("/manage-workday", workday.manageWorkDay);
  router.delete("/delete-workday", workday.deleteWorkDay);
  router.post('/transfer-workday', workday.transferWorkingDayToNextMonth);

  router.get("/get-salary", salary.getSalary);
  router.get("/get-admin-salary", salary.getAdminSalary);
  router.post("/manage-salary", salary.manageSalary);
  router.post("/manage-bank-detail", salary.manageBankDetail);

  router.delete("/delete-salary", salary.deleteSalary);
  router.post("/employee-salary", salary.employeeSalary);
  router.post("/mutiple-employee-salary", salary.MultipleEmployeeSalary);
  router.get("/get-all-salary", salary.getAllSalary);
  router.get("/download-pt-report", salary.ptReportDownload);

  router.post("/get-duplicate-salary", salary.getDuplicateSalary);
  router.post("/delete-duplicate-salary", salary.deleteDuplicateSalary);

  router.get("/get-bank", bank.getBank);
  router.get("/get-admin-bank", bank.getAdminBank);
  router.post("/manage-bank", bank.manageBank);
  router.delete("/delete-bank", bank.deleteBank);

  router.get("/get-group", group.getGroup);
  router.get("/get-admin-group", group.getAdminGroup);
  router.post("/manage-group", group.manageGroup);
  router.delete("/delete-group", group.deleteGroup);

  router.get("/get-monthly-attendance", monthly.getMonthlyAttendance);
  router.get(
    "/get-admin-monthly-attendance",
    monthly.getAdminMonthlyAttendance
  );
  router.post("/manage-monthly-attendance", monthly.manageMonthlyAttendance);
  router.delete("/delete-monthly-attendance", monthly.deleteMonthlyAttendance);

  router.get("/get-daily-attendance", daily.getDailyAttendance);
  router.get("/get-admin-daily-attendance", daily.getAdminDailyAttendance);
  router.post("/manage-daily-attendance", daily.manageDailyAttendance);
  router.delete("/delete-daily-attendance", daily.deleteDailyAttendance);
  router.post("/daily-attendance-report", daily.dailyAttendanceReport);
  router.post("/download-daily-attendance-sheet", employee.getAttendanceSheet)
  router.post("/import-daily-attendance", employee.importDailyData);
  router.delete("/delete-date-daily-attendance", daily.deleteDailyAttendanceByDate)
  router.post("/list-attendance-ledger", daily.attendanceLedger)
  router.post("/download-attendance-ledger", daily.attendanceLedgerPDFRport)

  router.get("/get-holiday", holiday.getHoliday);
  router.get("/get-admin-holiday", holiday.getAdminHoliday);
  router.post("/manage-holiday", holiday.manageHoliday);
  router.delete("/delete-holiday", holiday.deleteHoliday);

  router.get("/get-deduction", deduction.getDeduction);
  router.get("/get-admin-deduction", deduction.getAdminDeduction);
  router.post("/manage-deduction", deduction.manageDeduction);
  router.delete("/delete-deduction", deduction.deleteDeduction);
  router.post("/generate-deduction-report", deduction.getDeductionReport);
  router.post("/generate-loan-report", deduction.getLoanReceiveReport);

  router.get("/get-earning", earning.getEarning);
  router.get("/get-admin-earning", earning.getAdminEarning);
  router.post("/manage-earning", earning.manageEarning);
  router.delete("/delete-earning", earning.deleteEarning);
  router.post("/generate-earning-report", earning.getEarningReport);

  router.get("/get-loan", loan.getLoan);
  router.get("/get-admin-loan", loan.getAdminLoan);
  router.post("/manage-loan", loan.manageLoan);
  router.delete("/delete-loan", loan.deleteLoan);
  router.post("/generate-loan-issue-report", loan.getLoanIssueReport);
  router.post("/generate-loan-status-report", loan.genLoanStatusReport);
  router.get("/get-loan-summary/:employeeId", loan.loanSummary);

  router.get("/get-auth-person", authPerson.getAuhPerson);
  router.get("/get-admin-auth-person", authPerson.getAdminAuhPerson);
  router.post("/manage-auth-person", authPerson.manageAuthPerson);
  router.delete("/delete-auth-person", authPerson.deleteAuthPerson);

  router.get("/get-skill", skill.getSkill);
  router.get("/get-admin-skill", skill.getAdminSkill);
  router.post("/manage-skill", skill.manageSkill);
  router.delete("/delete-skill", skill.deleteSkill);

  router.get("/get-employee-type", employeeType.getEmployeeType);
  router.get("/get-admin-employee-type", employeeType.getAdminEmployeeType);
  router.post("/manage-employee-type", employeeType.manageEmployeeType);
  router.delete("/delete-employee-type", employeeType.deleteEmployeeType);

  router.post('/import-employee', employee.importEmployeeData);
  router.post('/get-monthly-sheet', employee.getMonthlySheet);
  router.post('/import-monthly-data', employee.importMonthlyData);
  router.post('/get-salary-report', employee.generateExcelReport);
  router.post('/import-salary-data', employee.importSalaryData);
  router.post('/create-month-salary', employee.createMonthSalary);

  router.post("/update-leaving-date", employee.updateLeavingDate);


  router.post('/manage-employee-leaves', employeeLeaves.manageEmployeeLeaves);
  router.get('/get-employee-leaves', employeeLeaves.getEmployeeLeaves)
  router.get('/get-employee-leave-report', employeeLeaves.getLeaveReport)

  router.post('/manage-leave-entry', leaveEntry.manageLeaveEntry);
  router.get('/get-leave-entry', leaveEntry.getLeaveEntries);
  router.delete('/delete-leave-entry', leaveEntry.deleteLeaveEntry);
  router.post('/get-leave-entry-report', leaveEntry.downloadLeavePdf);

  router.get('/download-project-report', daily.projectReport);
  router.post('/list-project-report', daily.listProjectreport);
  router.post('/project-report-download', daily.downloadProjectreport);
  router.post('/project-report-xlsx', daily.xlsxProjectreport);

  // Store ================================================================

  router.get("/get-unit", unit.getUnit);
  router.get("/get-admin-unit", unit.getAdminUnit);
  router.post("/manage-unit", unit.manageUnit);
  router.delete("/delete-unit", unit.deleteUnit);
  router.post("/upload-unit", unit.importUnit);
  router.get("/download-unit-format", unit.downloadFormate);

  router.get("/get-itemCategory", itemCategory.getCategory);
  router.get("/get-admin-itemCategory", itemCategory.getAdminCategory);
  router.post("/manage-itemCategory", itemCategory.manageItemCategory);
  router.delete("/delete-itemCategory", itemCategory.deleteItemCategory);
  router.post("/upload-itemCategory", itemCategory.uploadItemCategory);
  router.get("/download-itemCategory-format", itemCategory.downloadFormate);

  // Item Master
  router.get("/get-item", item.getItem);
  router.get("/get-admin-item", item.getAdminItem);
  router.post("/manage-item", item.manageItem);
  router.delete("/delete-item", item.deleteItem);
  router.post("/import-item", item.importItem);
  router.get("/download-item-format", item.downloadFile);
  router.post("/import-itemData", item.importItemData);
  router.get("/itemdata-format-download", item.downloadItemData);
  router.get("/download-items", item.downloadItemList);
  router.post("/update-item", item.updateItem);

  // Transport
  router.get("/get-transport", transport.getTransport);
  router.get("/get-admin-transport", transport.getAdminTransport);
  router.post("/manage-transport", transport.manageTransport);
  router.delete("/delete-transport", transport.deleteTransport);
  router.post("/upload-transport", transport.uploadTransport);
  router.get("/download-transport-format", transport.downloadFormate);

  router.get("/get-inventoryLocation", inventoryLocation.getInventoryLocation);
  router.get("/get-admin-inventoryLocation", inventoryLocation.getAdminInventoryLocation);
  router.post("/manage-inventoryLocation", inventoryLocation.manageInventoryLocation);
  router.delete(
    "/delete-inventoryLocation",
    inventoryLocation.deleteInventoryLocation
  );
  router.post(
    "/upload-inventoryLocation",
    inventoryLocation.uploadInventoryLocation
  );
  router.get(
    "/download-inventoryLocation-format",
    inventoryLocation.downloadFormate
  );

  router.get("/get-project", project.getProjects);
  router.get("/get-admin-project", project.getAdminProjects);
  router.post("/manage-project", project.manageProject);
  router.delete("/delete-project", project.deleteProject);

  router.post("/get-party", party.getParty);
  router.post("/get-admin-party", party.getAdminParty);
  router.post("/manage-party", party.manageParty);
  router.delete("/delete-party", party.deleteParty);

  router.get("/get-party-group", partyGroup.getPartyGroup);
  router.get("/get-admin-party-group", partyGroup.getAdminPartyGroup);
  router.post("/manage-party-group", partyGroup.managePartyGroup);
  router.delete("/delete-party-group", partyGroup.deletePartyGroup);

  router.post("/get-order", order.getOrder);
  // router.get('/get-admin-order', order.getAdminPartyGroup);
  router.post("/manage-order", order.manageOrder);
  router.delete("/delete-order", order.deleteOrder);
  router.post("/update-transaction-item", order.updateTransactionItem);

  router.get("/get-stock-list", stock.getStockList);
  router.post("/download-stock-list", stock.downloadStockItem);
  router.post("/stock-list-xlsx", stock.xlsxStockItem);

  router.get("/get-party-tag", partyTag.getPartyTag);
  router.post("/manage-party-tag", partyTag.managePartyTag);
  router.delete("/delete-party-tag", partyTag.deletePartyTag);

  router.post("/get-order-adjustment", orderAdjustment.getOrderAdujustment);
  router.post(
    "/manage-order-adjustment",
    orderAdjustment.manageOrderAdjustment
  );
  router.delete(
    "/delete-order-adjustment",
    orderAdjustment.deleteOrderAdjustment
  );

  router.post("/get-transaction-item", transactionItem.getTransactionItem);
  router.post("/manage-transaction-item", transactionItem.manageTransactionItem);
  router.delete("/delete-transaction-item", transactionItem.deleteTransactionItem);
  router.post("/manage-drawing-item", transactionItem.manageDrawing);
  router.post("/get-drawing-transaction", transactionItem.getDrawingTransaction);
  router.post("/get-item-request", transactionItem.getAllItemByRequest);


  router.post("/manage-purchase-offer", purchaseOffer.managePurchaseOffer);
  router.post("/get-purchase-offer", purchaseOffer.getPurchaseOffer);
  router.put("/update-purchase-offer", purchaseOffer.updatePurchaseOffer);
  router.post("/get-qc-approval", purchaseOffer.getQcQuanity);
  router.post("/send-offer-qc", purchaseOffer.sendToQc);
  router.delete("/delete-purchase-offer", purchaseOffer.deletePurchaseOffer);

  router.get("/get-unit-location", unitLocation.getUnitLocation);
  router.post("/manage-unit-location", unitLocation.manageUnitLocation);
  router.delete("/delete-unit-location/:id", unitLocation.deleteUnitLocation);

  // Erp =========================================================================================
  router.post("/manage-issue", materialIssue.manageIssue);
  router.post("/get-issue", materialIssue.getIssue);
  router.delete("/delete-issue", materialIssue.deleteIssue);

  router.post("/manage-issue-request", materialRequest.manageIssueRequest);
  router.post("/get-issue-request", materialRequest.getIssueRequest);
  router.post("/one-issue-request-download", materialRequest.downloadOneIssueRequest);
  router.post("/xlsx-one-issue-request", materialRequest.xlsxOfferRequestItem);


  router.post("/manage-issue-acceptance", materialAcceptance.manageIssueAcceptance);
  router.post("/get-issue-acceptance", materialAcceptance.getIssueAcceptance);
  router.post("/one-issue-acceptance-download", materialAcceptance.downloadOneIssueAcceptance);
  router.post("/xlsx-one-issue-acceptance", materialAcceptance.xlsxOneIssueAcceptance);

  router.post("/manage-fitup-inspection", fitupInspection.manageFitupInspection);
  router.post("/get-fitup-inspection", fitupInspection.getFitupInspecction);
  router.post("/get-fitup-inspection-approval", fitupInspection.getQcApproval);
  router.post("/one-fitup-inspection-download", fitupInspection.downloadOneFitupInspection);
  router.post("/xlsx-one-fitup-inspection", fitupInspection.xlsxOneFitupInspection);

  router.post("/manage-weld-inspection-offer", weldInspectionOffer.manageWeldInspectionOffer);
  router.post("/get-weld-inspection-offer", weldInspectionOffer.getWeldingInspectionOffer);
  router.post("/get-weld-inspection-approval", weldInspectionOffer.getQcWeldApproval);
  router.get('/get-final-dimension-offer', finalDimension.getFdOfferList);
  router.post('/manage-final-dimension-offer', finalDimension.manageFdOffer);
  router.post('/get-final-dimension-approval', finalDimension.acceptOffer);
  router.post('/one-final-dimension-download', finalDimension.downloadOneFDInspection);
  router.post('/xlsx-one-final-dimension', finalDimension.xlsxOneFDInspection);
  router.post('/download-fitup-inspection-offers', fitupInspection.downloadMultiInspectionOffers);
  router.post('/download-fitup-inspection-list', fitupInspection.downloadMultiInspectionList);
  router.post('/download-weld-visuals', weldInspectionOffer.downMultiWeldVisualOffers);
  router.post('/download-weld-inspection-list', weldInspectionOffer.downMultiWeldVisualInspections);

  router.get('/get-inspect-summary', InspectSummary.getInspectSummary);
  router.post('/manage-inspect-summary', InspectSummary.manageInspectSummary);
  router.post('/one-inspect-summary-download', InspectSummary.downloadOneInspectionSummary);


  router.post("/one-weld-inspection-download", weldInspectionOffer.downloadOneWeldVisule);
  router.post("/xlsx-one-weld-inspection", weldInspectionOffer.xlsxOneWeldVisule);

  router.get("/get-wps-master", wpsMaster.getWpsMaster);
  router.post("/manage-wps-master", wpsMaster.manageWpsMaster);
  router.delete("/delete-wps-master", wpsMaster.deleteWpsMaster);
  router.get('/download-xlsx-wps-master', wpsMaster.downloadWpsMaster);

  router.get("/get-joint-type", jointType.getJointType);
  router.post("/manage-joint-type", jointType.manageJointType);
  router.delete("/delete-joint-type", jointType.deleteJointType);

  router.get("/get-ndt", ndt.getNDT);
  router.post("/manage-ndt", ndt.manageNDT);
  router.delete("/delete-ndt", ndt.deleteNDT);

  router.get("/get-ndt-master", ndtMaster.getNDT);
  router.post("/manage-ndt-master", ndtMaster.manageNDT);
  router.post("/one-ndt-master-download", ndtMaster.downloadOneNDT);
  router.post("/xlsx-one-ndt-master", ndtMaster.xlsxOneNDT);

  router.get("/get-ndt-offer", TestOffer.getTestOffer);
  router.post("/manage-ndt-offer", TestOffer.manageTestOffer);
  router.post("/one-ndt-offer-download", TestOffer.downloadNDTOffer);
  router.post("/xlsx-one-ndt-offer", TestOffer.xlsxOneNDTOffer);

  router.get("/get-ut-report", UtInspection.getUTInspectionReport);
  router.post("/manage-ut-report", UtInspection.manageUTInspectionReport);
  router.post("/one-ut-report-download", UtInspection.downloadUTOfferReport);
  // router.post("/xlsx-one-ut-report", UtInspection.xlsxUTOfferReport);

  router.get("/get-rt-report", RtInspection.getRTInspectionReport);
  router.post("/manage-rt-report", RtInspection.manageRTInspectionReport);
  router.post("/one-rt-report-download", RtInspection.downloadRTOfferReport);
  // router.post("/xlsx-one-rt-report", RtInspection.xlsxRTOfferReport);

  router.get("/get-mpt-report", MptInspectionReport.getMptInspectionReport);
  router.post("/manage-mpt-report", MptInspectionReport.manageMptInspectionReport);
  router.post("/one-mpt-report-download", MptInspectionReport.downloadMPTOfferReport);

  router.get("/get-lpt-report", LptInspectionReport.getLPTInspectionReport);
  router.post("/manage-lpt-report", LptInspectionReport.manageLPTInspectionReport);
  router.post("/one-lpt-report-download", LptInspectionReport.downloadLPTOfferReport);

  router.get("/get-painting-system", paintingSystem.getPaintingSystem);
  router.post("/manage-painting-system", paintingSystem.managePaintingSystem);
  router.delete("/delete-painting-system", paintingSystem.deletePaintingSystem);

  router.get("/get-contractor", contractor.getContractor);
  router.post("/manage-contractor", contractor.manageContractor);
  router.delete("/delete-contractor", contractor.deleteContractor);

  router.get("/get-qualified-welder", qualifiedWelder.getQualifiedWelder);
  router.post(
    "/manage-qualified-welder",
    qualifiedWelder.manageQualifiedWelderList
  );
  router.delete(
    "/delete-qualified-welder",
    qualifiedWelder.deleteQualifiedWelder
  );
  router.get("/download-xlsx-qualified-welder", qualifiedWelder.downloadWelderXlsx)

  router.get(
    "/get-procedure-specification",
    ProcedureAndSpecification.getProcedureAndSpecification
  );
  router.post(
    "/manage-procedure-specification",
    ProcedureAndSpecification.manageProcedureAndSpecification
  );
  router.delete(
    "/delete-procedure-specification",
    ProcedureAndSpecification.deleteProcedureAndSpecification
  );
  router.get("/download-xlsx-procedure-specification", ProcedureAndSpecification.downloadProcedureAndSpecification);

  router.get("/get-paint-manufacturer", PaintManufacturer.getPaintManufacturer);
  router.post(
    "/manage-paint-manufacturer",
    PaintManufacturer.managePaintManufacturer
  );
  router.delete(
    "/delete-paint-manufacturer",
    PaintManufacturer.deletePaintManufacture
  );


  router.get('/get-dispatch-note', DispachNote.getDispatchNotes);
  router.post('/manage-dispatch-note', DispachNote.manageDispatchNote);
  router.post('/dispatch-note-download', DispachNote.downloadOneDispatch);

  router.get('/get-release-notes', IRNModel.getInspectionReleaseNote);
  router.get('/get-dispatch-note', DispachNote.getDispatchNotes);
  router.post('/manage-dispatch-note', DispachNote.manageDispatchNote);

  //Planner----------------------------------------------------------------------------------

  router.get("/get-drawing", draw.getDrawing);
  router.post("/", draw.drawingIssueDownload);
  router.post("/xlsx-drawing-issue", draw.xlsxOfferInspactionItem);
  router.post("/one-drawing-issue-download", draw.oneDrawingDownload);
  router.post("/get-admin-drawing", draw.getAdminDrawing);
  router.post("/manage-drawing", draw.manageDrawing);
  router.delete("/delete-drawing", draw.deleteDrawing);
  router.post("/get-project-drawings", draw.getProjectDrawings);
  router.post("/issue-drawing", draw.issueDrawing);
  router.get("/daily-progress-report", draw.getDPReport);
  router.post("/download-daily-progress-report", draw.downloadExcelDPReport);
  router.post('/import-drawing', draw.importDrawing);
  router.post("/update-drawing", draw.uploadDrawingPdf);
  router.get("/request-item-import-sample", draw.getRequestImportSample);
  router.post("/import-request-item", draw.importRequestItem);
  router.get("/drawing-item-import-sample", draw.getDrawingImportSample);
  router.post("/import-drawing-item", draw.importDrawingItem);
  router.post("/import-grid-items", draw.importGridItem);

  // router.post("/manage-request", request.manageRequest);
  router.post("/get-request", request.getRequest);
  router.post("/get-request-edit", request.getRequestEdit);
  router.post("/get-store-request", request.getStoreRequest);
  router.post("/get-store-request-item", request.downloadOneRequestItem);
  router.post("/xlsx-purchase-request", request.xlsxOneRequestItem);
  router.post("/get-offer-request-item", request.downloadOfferRequestItem);
  router.post("/xlsx-material-offer", request.xlsxOfferRequestItem);
  router.post("/get-material-inspection-item", request.downloadMaterialInspactionItem);
  router.post("/xlsx-material-inspection", request.xlsxOfferInspactionItem);

  router.get("/get-item-request", request.getRequest);
  router.post("/manage-request", request.manageRequest);
  router.delete("/delete-request", request.deleteRequest);
  // router.post("/download-all", request.downloadAllOffersForRequest);

  //  Paint =================================================================
  router.get('/get-surface-primer', surfacePrimer.getSurfacePrimer);
  router.post('/manage-surface-primer', surfacePrimer.manageSurfacePrimer);
  router.post('/get-surface-approval', surfacePrimer.getSurfaceApproval);
  router.post('/surface-download', surfacePrimer.downloadSurfacePaint);

  router.get('/get-mio-paint', mioCtrl.getMIOTable);
  router.post('/manage-mio-paint', mioCtrl.manageMIOTable);
  router.post('/get-mio-approval', mioCtrl.getMioApproval);
  router.post('/mio-download', mioCtrl.downloadMioPaint);

  router.get('/get-final-paint', finalPaintCtrl.getFinalCoatData);
  router.post('/manage-final-paint', finalPaintCtrl.manageFinalCoat);
  router.post('/get-final-paint-approval', finalPaintCtrl.getFinalCoatApproval);
  router.post('/final-paint-download', finalPaintCtrl.downloadFinalPaint);

  //Main store general tag==================================================================================
  router.post("/manage-tag", tag.manageTag);
  router.delete("/delete-tag", tag.deleteTag);
  router.get("/get-tag", tag.getTag);

  //Main store general master==================================================================================
  router.post("/manage-master", master.manageMaster);
  router.delete("/delete-master", master.deleteMaster);
  router.get("/get-master", master.getMaster);


  router.post("/get-ms-alltransaction", transaction.getAllTransaction);
  router.get("/get-ms-onetransaction", transaction.getOneTransaction);
  router.post("/one-ms-transaction-download", transaction.downloadOneTransaction);
  router.post("/purchase-order-download", transaction.downloadPurchaseOrder);
  router.post("/list-ms-transaction", transaction.transactionList);
  router.post("/xlsx-ms-trans-download", transaction.transactionExcelReport);
  router.post("/pdf-ms-trans-download", transaction.transactionPDFRport);
  router.post('/list-one-purchaseissue', transaction.onePurchaseAndIssueList);
  router.post('/one-purchase-download', transaction.downloadOnePurchase);
  router.post('/one-issue-download', transaction.downloadOneIssue);

  //Purchase request

  router.post('/add-one-pr', transaction.addPR);
  router.post('/add-pr-item', transaction.addPRItem);
  router.post('/list-pr', transaction.listPR);
  router.post('/one-pr', transaction.onePR);
  router.put('/delete-pr', transaction.deletePR);
  router.put('/delete-pr-item', transaction.deletePRItem);
  router.put('/update-pr', transaction.updatePR);
  router.put('/update-pr-item', transaction.updatePRItem);
  router.post('/list-pr-no', transaction.listPRNumber);
  router.post('/pr-download-list', transaction.PRDownloadList);
  router.post('/pr-download-pdf', transaction.PRDownloadPDF);

  //Purchase order

  router.post('/list-pr-item-po', transaction.listPRItemForPO);
  router.post('/add-one-po', transaction.addPO);
  router.post('/add-po-item', transaction.addPOItem);
  router.post('/list-po', transaction.listPO);
  router.post('/one-po', transaction.onePO);
  router.put('/delete-po', transaction.deletePO);
  router.put('/delete-po-item', transaction.deletePOItem);
  router.put('/update-po', transaction.updatePO);
  router.put('/update-po-item', transaction.updatePOItem);
  router.post('/list-po-no', transaction.listPONumber);
  router.post('/po-download-list', transaction.PODownloadList);
  router.post('/po-download-pdf', transaction.PODownloadPDF);

  //Purchace

  router.post('/list-po-item-pu', transaction.listPOItemForPU);
  router.post('/add-one-pu', transaction.addPU);
  router.post('/add-pu-item', transaction.addPUItem);
  router.post('/list-pu', transaction.listPU);
  router.post('/one-pu', transaction.onePU);
  router.put('/delete-pu', transaction.deletePU);
  router.put('/delete-pu-item', transaction.deletePUItem);
  router.put('/update-pu', transaction.updatePU);
  router.put('/update-pu-item', transaction.updatePUItem);
  router.post('/list-pu-no', transaction.listPUNumber);
  router.post('/list-pu-bill-no', transaction.listPUBillNumber);
  router.post('/list-pu-challan-no', transaction.listPUChallanNumber);
  router.post('/pu-download-list', transaction.PUDownloadList);
  router.post('/pu-download-pdf', transaction.PUDownloadPDF);

  //Purchase return

  router.post('/list-pu-pur', transaction.listPUForPUR);
  router.post('/add-one-pur', transaction.addPUR);
  router.post('/add-pur-item', transaction.addPURItem);
  router.post('/list-pur', transaction.listPUR);
  router.post('/one-pur', transaction.onePUR);
  router.put('/delete-pur', transaction.deletePUR);
  router.put('/delete-pur-item', transaction.deletePURItem);
  router.put('/update-pur', transaction.updatePUR);
  router.put('/update-pur-item', transaction.updatePURItem);
  router.post('/list-pur-no', transaction.listPURNumber);
  router.post('/pur-download-list', transaction.PURDownloadList);
  router.post('/pur-download-pdf', transaction.PURDownloadPDF);

  //Issue

  router.get('/all-gate-pass', transaction.listAllGatePass);
  router.post('/add-one-iss', transaction.addISS);
  router.post('/add-iss-item', transaction.addISSItem);
  router.post('/list-iss', transaction.listISS);
  router.post('/list-iss-return', transaction.listISSItemReturn);
  router.post('/one-iss', transaction.oneISS);
  router.put('/delete-iss', transaction.deleteISS);
  router.put('/delete-iss-item', transaction.deleteISSItem);
  router.put('/update-iss', transaction.updateISS);
  router.put('/update-iss-item', transaction.updateISSItem);
  router.post('/iss-gate-pass', transaction.listISSGatePass);
  router.post('/list-iss-no', transaction.listISSNumber);
  router.post('/iss-challan-no', transaction.listISSChallanNumber);
  router.post('/iss-download-list', transaction.ISSDownloadList);
  router.post('/iss-download-pdf', transaction.ISSDownloadPDF);
  router.post('/iss-sort-download-pdf', transaction.ISSDownloadWithoutAmtPDF);
  router.post('/iss-long-download-pdf', transaction.ISSDownloadWithAmtPDF);

  //Issue return

  router.post('/list-iss-isr', transaction.listISSForISR);
  router.post('/add-one-isr', transaction.addISR);
  router.post('/add-isr-item', transaction.addISRItem);
  router.post('/list-isr', transaction.listISR);
  router.post('/one-isr', transaction.oneISR);
  router.put('/delete-isr', transaction.deleteISR);
  router.put('/delete-isr-item', transaction.deleteISRItem);
  router.put('/update-isr', transaction.updateISR);
  router.put('/update-isr-item', transaction.updateISRItem);
  router.post('/isr-download-list', transaction.ISRDownloadList);
  router.post('/isr-download-pdf', transaction.ISRDownloadPDF);
  router.post('/isr-sort-download-pdf', transaction.ISRDownloadWithoutAmtPDF);
  router.post('/isr-long-download-pdf', transaction.ISRDownloadWithAmtPDF);

  // Item Summary

  router.post("/item-summary-list", transaction.itemSummaryList);
  router.post("/item-summary-download", transaction.itemSummaryPDFRport);
  router.post('/item-summary-excel-download', transaction.itemSummaryExcelReport);


  //Item Ledger

  router.post("/legder-list", transaction.itemLedgerList);
  router.post("/legder-download", transaction.itemLedgerPDFRport);


  // Main store Stock List
  router.post("/ms-stockitem", msStock.MsitemStockList);
  router.post("/ms-stock", msStock.MSstockList);
  router.post("/ms-stock-download", msStock.downloadMSStock);
  router.post("/ms-stock-xslx", msStock.msStockExcelReport);
  router.post("/reorder-item-excel-download", msStock.downloadItemStoreExcel);
  router.post("/reorder-item-download", msStock.downloadItemStore);
  router.post("/reorder-item-list", msStock.storeReOrderList);
 router.post("/year-stock-transfer", createYearStockTransfer.createYearStockTransfer);

  // Permission management
  router.post("/add-permission", permission.addPermission);
  router.post("/manage-permission", permission.managePermission);
  router.delete("/delete-permission", permission.deletePermission);
  router.get("/get-permission", permission.getPermission);
  router.get("/get-one-permission", permission.getOnePermission);

  router.post("/manage-packings", Packing.managePacking);
  router.get("/get-packings", Packing.getPackings);

  router.post("/manage-invoice", Invoice.manageInvoice);
  router.get("/get-invoices", Invoice.getInvoice);
  router.delete('/delete-invoice', Invoice.deleteInvoice);
  router.post('/get-one-invoice', Invoice.getOneInvoice);
  router.post('/one-invoice-download', Invoice.downloadOneInvoice);
  router.post('/xlsx-one-invoice', Invoice.xlsxOneInvoice);
  router.post('/get-all-invoice', Invoice.getAllInvoice);
  router.post('/all-invoice-download', Invoice.downloadAllInvoice);
  router.post('/xlsx-all-invoice', Invoice.xlsxAllInvoice);

  router.get('/get-project-location', ProjectLocation.getProjectLocation);
  router.post('/manage-project-location', ProjectLocation.manageProjectLocation);
  router.delete('/delete-project-location', ProjectLocation.deleteProjectLocation);

  router.post("/get-pms-dashboard", user.pmsStore);


  // Mutiple drawing sections
  router.post("/get-multi-issue-request", MultiRequest.getIssueRequest);
  router.post("/manage-multi-issue-request", MultiRequest.manageIssueRequest);
  router.post("/download-multi-issue-request", MultiRequest.downloadOneIssueRequest);

  router.post("/get-multi-issue-acceptance", MultiAcceptance.getIssueAcceptance);
  router.post("/manage-multi-issue-acceptance", MultiAcceptance.manageIssueAcceptance);
  router.post("/download-multi-issue-acceptance", MultiAcceptance.downloadOneIssueAcceptance);
  router.post("/get-material-issue-acceptance-master-data", MultiAcceptance.getIssueAcceptanceMasterData);
  router.post("/excel-issue-acceptance-download", MultiAcceptance.getIssueAcceptanceExcelDownload);
  router.post("/manage-grid", Grids.manageGrid);
  router.post("/get-grid", Grids.getAllGrids);
  router.delete("/delete-grid", Grids.deleteGrid);

  router.post('/get-multi-grid-drawing', Grids.getMultiGridDrawing);

  router.get('/get-issue-offer-table', IssueOffTable.getIssueOfferTable);
  router.post('/manage-issue-offer-table', IssueOffTable.manageIssueOfferTable);
  router.post('/remove-issue-offer-table', IssueOffTable.removeIssueOfferTable);
  router.post('/update-issue-offer-table', IssueOffTable.updatedIssueOfferTable);

  router.post("/manage-grid-items", GridItem.manageDrawingItem);
  router.post("/get-grid-items", GridItem.getDrawingItems);
  router.post("/get-drawing-master-data", GridItem.getDrawingMasterData);
  router.post("/get-drawing-master-data-excel-download", GridItem.getDrawingMasterDataExcelDownload);


  router.delete("/delete-grid-items", GridItem.deleteDrawingItem);
  router.post("/update-grid-balance", GridItem.updateGridBalance);
  router.post("/get-multi-grid-items", GridItem.getMultiGridItems);

  router.post("/manage-multi-fitup", MultiFitup.manageFitupInspection);
  router.get("/get-multi-fitup", MultiFitup.getFitupInspection);
  router.post("/update-issue-grid-balance", MultiFitup.updateFitupGridBalance);
  router.post("/verify-fitup-offer", MultiFitup.verifyQcDetails);
  router.post("/one-multi-fitup", MultiFitup.oneMultiFitup);
  router.post("/one-multi-fitup-download", MultiFitup.downloadOneMultiFitup);
  router.post("/update-multi-fitup-moveqty", MultiFitup.multiFitupMoveToNextItems);

  router.post("/grid-wise-report", draw.GridWiseSingleDrawing);
  router.post("/filtered-drawing-issue-report", draw.filterDrawingReports);

  router.post("/manage-mutli-weld-visual", MultiWeldVisual.manageWeldVisualInspection);
  router.post("/update-fitup-grid-balance", MultiWeldVisual.updateWeldVisualGridBalance);
  router.get("/get-multi-weldvisual", MultiWeldVisual.getWeldVisualInspection);
  router.post('/verify-weldvisual-offer', MultiWeldVisual.verifyWeldQcDetails);
  router.post('/list-multi-wedvisual', MultiWeldVisual.oneMultiWeld);
  router.post('/multi-weldvisual-download', MultiWeldVisual.downloadOneMultiWeld);

  router.post("/update-ndt-grid-balance", MultiNDT.updateNDTGridBalance);
  router.post("/manage-ndt-master-table", MultiNDT.manageNDTInspection);
  router.get("/get-multi-ndt-master", MultiNDT.getNDTInspection);
  router.post("/list-multi-ndt-master", MultiNDT.listOneMultiNDTMaster);
  router.post("/multi-ndt-master-download", MultiNDT.downloadOneMultiNDTMaster);

  router.get('/get-fitup-offer-table', FitupOffTable.getFitupTableOff);
  router.post('/manage-fitup-offer-table', FitupOffTable.manageFitupOfferTable);
  router.post('/remove-fitup-offer-table', FitupOffTable.removeFitupOfferTable);
  router.post('/update-fitup-offer-table', FitupOffTable.updatedFitupOfferTable);

  router.get('/get-weld-offer-table', WeldVisualOfferTable.getWeldVisualTableOffer);
  router.post('/manage-weld-offer-table', WeldVisualOfferTable.manageWeldVisualOfferTable);
  router.post('/remove-weld-offer-table', WeldVisualOfferTable.removeWeldVisualOfferTable);
  router.post('/update-weld-offer-table', WeldVisualOfferTable.updatedWeldVisualOfferTable);

  router.get('/get-ndt-offer-table', NDTOfferTable.getNDTOfferTable);
  router.post('/manage-ndt-offer-table', NDTOfferTable.manageNDTOfferTable);
  router.post('/remove-ndt-offer-table', NDTOfferTable.removeNDTOfferTable);
  router.post('/update-ndt-offer-table', NDTOfferTable.updatedNDTOfferTable);

  router.get('/get-ndt-typewise-offer', NDTTypeOfferTable.getNDTTypeOffer);
  router.post('/manage-ndt-typewise-offer', NDTTypeOfferTable.manageNDTTypeOffer);

  router.post('/generate-ndt-typewise-offer', NDTOfferTable.generateNDTTypewiseOffer);
  router.get('/get-ndt-generated-offer', NDTOfferTable.getNDTTypewiseOffer);
  router.post('/remove-ndt-generated-offer', NDTOfferTable.removeNDTTypewiseOffer);
  router.post('/save-ndt-typewise-offer', NDTOfferTable.saveNDTTypewiseOffer);
  router.post('/list-one-multi-ndt-offer', NDTOfferTable.oneMultiNDTOffer);
  router.post('/download-one-multi-ndt-offer', NDTOfferTable.downloadMultiNDTOffer);

  router.post("/manage-multi-ut-report", MultiUtInspection.manageUTInspectionReport);
  router.post("/manage-multi-mpt-report", MultiMPTInspection.manageMptInspectionReport);
  router.post("/manage-multi-lpt-report", MultiLPTInspection.manageLPTInspectionReport);
  router.post("/manage-multi-rt-report", MultiRTInspection.manageRTInspectionReport);

  router.get('/get-multi-ut-clearance', MultiUtInspection.getUtMultiClearance)
  router.post('/one-multi-ut-inspection', MultiUtInspection.oneMultiUTInspection)
  router.post('/download-multi-ut-inspection', MultiUtInspection.downloadMultiUTInspection)

  router.get('/get-multi-rt-clearance', MultiRTInspection.getRtMultiClearance);
  router.post('/one-multi-rt-inspection', MultiRTInspection.oneMultiRTInspection);
  router.post('/download-multi-rt-inspection', MultiRTInspection.downloadMultiRTInspection);

  router.get('/get-multi-mpt-clearance', MultiMPTInspection.getMptMultiClearance);
  router.post('/one-multi-mpt-inspection', MultiMPTInspection.oneMultiMPTInspection);
  router.post('/download-multi-mpt-inspection', MultiMPTInspection.downloadMultiMPTInspection);

  router.get('/get-multi-lpt-clearance', MultiLPTInspection.getLptMultiClearance);
  router.post('/one-multi-lpt-inspection', MultiLPTInspection.oneMultiLPTInspection);
  router.post('/download-multi-lpt-inspection', MultiLPTInspection.downloadMultiLPTInspection);

  router.get('/get-multi-fd', MultiFD.getFinalDimension)
  router.post('/manage-multi-fd', MultiFD.manageFinalDimension);
  router.post("/update-fd-grid-balance", MultiFD.updateFDGridBalance);

  router.post('/get-fd-offer-table', MultiFDOfferTable.getFdOfferTable);
  router.post('/manage-fd-offer-table', MultiFDOfferTable.manageFDOfferTable);
  router.post('/remove-fd-offer-table', MultiFDOfferTable.removeFDOfferTable);
  router.post('/update-fd-offer-table', MultiFDOfferTable.updateFDOfferTable);
  router.post('/verify-fd-offer', MultiFD.verifyFDQcDetails);
  router.post("/one-multi-fd", MultiFD.oneMultiFD);
  router.post("/one-multi-fd-download", MultiFD.downloadOneMultiFD);

  // Inspection

  router.post('/add-multi-inspect-summary', MultiInspectSummary.addMultiInspectioSummary);
  router.post('/get-multi-inspect-summary', MultiInspectSummary.getMultiInspectList);
  router.post('/generate-multi-inspect', MultiInspectSummary.generateInspect);
  router.post('/list-multi-inspect-generate', MultiInspectSummary.MultiGenerateInspectList);
  router.post('/download-multi-inspect-generate', MultiInspectSummary.downloadGenerateInspect);

  // Dispatch offer & inspection

  router.post('/manage-multi-dispatch-offer', MultiDispatchOffer.manageDispatchOfferTable);
  router.post('/update-multi-dispatch-offer', MultiDispatchOffer.updateDispatchOffer);
  router.post('/delete-multi-dispatch-offer', MultiDispatchOffer.deleteDispatchOffer);
  router.post('/list-multi-dispatch-offer', MultiDispatchOffer.getDispatchOffer);
  router.post('/is-grid-balance-update', MultiDispatchOffer.updateISGridBalance);

  router.post('/manage-multi-dispatch', MultiDispatch.manageMultiDispatchNote);
  router.post('/get-multi-dispatch', MultiDispatch.getMultiDispatchNote);
  router.post('/get-one-multi-dispatch', MultiDispatch.oneDispatchNote);
  router.post('/download-multi-dispatch', MultiDispatch.downloadOneMultiDispatch);

  // Surface offer & inspection

  router.post('/manage-multi-surface-offer', MultiSurfaceOffer.manageSurfaceOfferTable);
  router.post('/update-multi-surface-offer', MultiSurfaceOffer.updateSurfaceOffer);
  router.post('/delete-multi-surface-offer', MultiSurfaceOffer.deleteSurfaceOffer);
  router.post('/list-multi-surface-offer', MultiSurfaceOffer.getSurfaceOffer);
  router.post('/dnp-grid-balance-update', MultiSurfaceOffer.updateDNPGridBalance);

  router.post('/add-multi-surface-offer', MultiSurfaceInspection.generateSurfaceOffer);
  // router.post('/add-multi-surface-offer-from-dispatch', MultiSurfaceInspection.generateSurfaceOfferFromDispatch);
  router.post('/get-multi-surface', MultiSurfaceInspection.getMultiSurfaceInspectionOffer);
  router.post('/verify-multi-surface', MultiSurfaceInspection.verifySurfaceQcDetails);
  router.post('/get-one-multi-surface', MultiSurfaceInspection.oneSurface);
  router.post('/download-multi-surface', MultiSurfaceInspection.downloadOneMultiSurface);

  // Mio offer & inspection

  router.post('/manage-multi-mio-offer', MultiMIOOffer.manageMioOfferTable);
  router.post('/update-multi-mio-offer', MultiMIOOffer.updateMioOffer);
  router.post('/delete-multi-mio-offer', MultiMIOOffer.deleteMioOffer);
  router.post('/list-multi-mio-offer', MultiMIOOffer.getMioOffer);
  router.post('/surface-grid-balance-update', MultiMIOOffer.updateSurfaceGridBalance);
  router.post('/dnp-balance-update', MultiMIOOffer.updateDNPGridBalanceMio);

  router.post('/add-multi-mio-offer', MultiMIOInspection.generateMIOOffer);
  router.post('/get-multi-mio', MultiMIOInspection.getMultiMIOInspectionOffer);
  router.post('/verify-multi-mio', MultiMIOInspection.verifyMIOQcDetails);
  router.post('/get-one-multi-mio', MultiMIOInspection.oneMIO);
  router.post('/download-multi-mio', MultiMIOInspection.downloadOneMultiMIO);

  // Final Coat offer & inspection

  router.post('/manage-multi-final-coat-offer', MultiFCOffer.manageFinalCoatOfferTable);
  router.post('/update-multi-final-coat-offer', MultiFCOffer.updateFinalCoatOffer);
  router.post('/delete-multi-final-coat-offer', MultiFCOffer.deleteFinalCoatOffer);
  router.post('/list-multi-final_coat-offer', MultiFCOffer.getFinalCoatOffer);
  router.post('/mio-grid-balance-update', MultiFCOffer.updateSurfaceGridBalance);
  router.post('/dnp-grid-balance-update-final-coat', MultiFCOffer.updateDNPGridBalanceFinalCoat);

  router.post('/add-multi-final-coat-offer', MultiFCInspection.generateFCOffer);
  router.post('/get-multi-final-coat', MultiFCInspection.getMultiFCInspectionOffer);
  router.post('/verify-multi-final_coat', MultiFCInspection.verifyFCQcDetails);
  router.post('/get-one-multi-final_coat', MultiFCInspection.oneFC);
  router.post('/download-multi-final_coat', MultiFCInspection.downloadOneMultiFC);

  // release note
  router.post('/add-multi-release-note', MultiReleaseNote.addMultiReleaseNotesData);
  router.post('/get-multi-release-note', MultiReleaseNote.getMultiReleaseNoteList);
  router.post('/generate-multi-release-note', MultiReleaseNote.generateReleaseNote);
  router.post('/list-multi-release-generate', MultiReleaseNote.MultiGenerateReleaseNoteList);
  router.post('/download-multi-release-generate', MultiReleaseNote.downloadGenerateInspect);

  // Packing Offer Table
  router.post('/manage-multi-packing-offer', PackingOffTable.managePackingOfferTable);
  router.post('/get-multi-packing-offer', PackingOffTable.getPackingOffer);
  router.post('/delete-multi-packing-offer', PackingOffTable.deletePackingOffer);
  router.post('/release-grid-balance-update', PackingOffTable.updateReleaseGridBal);

  // Packing Ins List
  router.post('/get-multi-packing', PackingInspection.getMultiPacking);
  router.post('/manage-multi-packing', PackingInspection.manageMultiPacking);
  router.post('/download-multi-packing', PackingInspection.downloadOneMultiPacking);

  // NEW DPR WITH GRID
  router.get('/get-grid-dpr', draw.dprGridReport);
  router.post('/download-grid-xlsx-dpr', draw.drpXlsxGridReport);

    // DMR
  router.get("/download-dmr-format", Dmr.downloadFile);
  router.post("/dmr/manage-dmr", Dmr.manageDMR);
  router.post("/dmr/get-by-project", Dmr.getDMRByProject);
  router.post("/dmr/export", Dmr.exportDMRToExcel);
 
 
  // DMR Categories
  router.post("/dmr-categories/get-dmr-categories", DmrCategory.getCategoriesByProject);
  router.post("/dmr-categories/manage-dmr-category", DmrCategory.manageCategory);
  router.delete("/dmr-categories/delete-dmr-category", DmrCategory.deleteCategory);

  router.get("/get-user-firm/:fId", firm.getUserFirm);
  router.get("/get-user-project/:pId", project.getOneProject);
  router.post("/get-project-in-ex", project.getProjectIncomeExpense);
  router.post("/get-current-project-in-ex", project.getProjectCurruentMonth);
  router.post("/get-last_date-project-in-ex", project.getProjectLastDate);

  // Invoice 
  router.post('/get-multi-invoice', MultiInvoice.getInvoice);
  router.post('/manage-multi-invoice', MultiInvoice.manageInvoice);
  // router.post('/download-xlsx-invoice', MultiInvoice.downloadXlsxInvoice);
  router.post('/download-pdf-invoice', MultiInvoice.downloadPdfInvoice)


  router.post('/add-usable-stock', usableStock.addUsable);
  router.post('/list-usable-stock', usableStock.getUsableList);
  router.post('/list-usable-stock-verify', usableStock.getUsableStockverify);
  router.post('/update-usable-stock', usableStock.updateUsableStock);
  router.post('/delete-usable-stock', usableStock.deleteUsableStock);
  router.post('/pdf-usable-stock', usableStock.UsableListPDF);
  router.post('/xlsx-usable-stock', usableStock.UsableListXLSX);

  router.post('/update-gatepass', employee.updateGatePass);
  router.post('/add-punch-machine-no', employee.addGatepassNo);
  router.get("/get-puch-employe-logs", punchMachine.getEmployeesWithPunchLogs);
  
  app.use("/api/user", router);
};