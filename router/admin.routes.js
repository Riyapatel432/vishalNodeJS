module.exports = (app) => {
  var router = require("express").Router();

  const { adminTokenValidator } = require("../helper/index");

  router.use(adminTokenValidator);

  const admin = require("../controllers/admin.controller");
  const firm = require("../controllers/firm.controller");
  const year = require("../controllers/year.controller");
  const user = require("../controllers/user.controller");
  const store = require("../controllers/store.controller");

  // payroll
  const group = require("../controllers/payroll/group.controller");
  const bank = require("../controllers/payroll/bank.controller");
  const department = require("../controllers/payroll/department.controller");
  const shift = require("../controllers/payroll/shift.controller");
  const designation = require("../controllers/payroll/designation.controller");

  const employee = require("../controllers/payroll/employ.controller");
  const salary = require("../controllers/payroll/salary.controller");
  const workday = require("../controllers/payroll/workDay.controller");
  const monthlyAttendance = require("../controllers/payroll/monthly.attendance.controller");
  const dailyAttendance = require("../controllers/payroll/daily.attendance.controller");
  const earning = require("../controllers/payroll/earning.controller");
  const deduction = require("../controllers/payroll/deduction.controller");
  const loan = require("../controllers/payroll/loan.controller");
  const holiday = require("../controllers/payroll/holiday.controller");
  const auth_person = require("../controllers/payroll/auth_person.controller");

  const skill = require("../controllers/payroll/skill.controller");
  const employeeType = require("../controllers/payroll/employee_type.controller");

  // Store
  const role = require("../controllers/user_role.controller");
  const itemCategory = require("../controllers/store/item_category.controller");
  const inventoryLocation = require("../controllers/store/inventory_location.controller");
  const itemStock = require("../controllers/store/item_stock.controller");
  const supplier = require("../controllers/store/supplier.controller");
  const client = require("../controllers/client.controller");
  const project = require("../controllers/project.controller");
  const transport = require("../controllers/store/transport.controller");
  const customer = require("../controllers/store/customer.controller");
  const item = require("../controllers/store/item.controller");

  const party = require("../controllers/store/party.controller");
  const partyTag = require("../controllers/store/party_tag.controller");
  const partyGroup = require("../controllers/store/partyGroup.controller");

  const unit = require("../controllers/store/unit.controller");

  // User Permission
  const userperm = require("../controllers/user_permission.controller");


  // MAin Store =================================================================
  const transaction = require("../controllers/main-store/transaction/transaction.controller");
  const msStock = require("../controllers/main-store/stock/stock.controller");

  // PMS =================================================================
  const erpRoles = require("../controllers/erp/erp_role.controller");
  const request = require("../controllers/erp/planner/request.controller");
  const contractor = require("../controllers/erp/Contractor/contractor.controller");
  const pmsStock = require("../controllers/store/item_stock.controller");
  const ProjectLocation = require("../controllers/erp/ProjectLocation/project_location.controller");
  // =================================================================================


  router.post("/login", admin.login);
  router.post("/forgot-password", admin.forgotPassword);
  router.post("/verify-otp", admin.verifyOtp);
  router.get("/check-account", admin.checkAccount);
  router.post("/reset-password", admin.resetPassword);

  router.post("/change-password", admin.changePassword);
  router.get("/get-profile", admin.getProfile);
  router.post("/update-profile", admin.updateProfile);
  router.get("/storeDashboard", admin.StoreDashboard);
  router.get('/get-admin-dashboard', admin.getAdminDashboard);
  router.get("/get-att-count", admin.getEmpAttCount);

  // Firm Management
  router.get("/get-firm", firm.getFirm);
  router.get("/get-admin-firm", firm.getAdminFirm);
  router.post("/manage-firm", firm.manageFirm);
  router.delete("/delete-firm", firm.deleteFirm);

  // Group Management
  router.get("/get-group", group.getGroup);
  router.get("/get-admin-group", group.getAdminGroup);
  router.post("/manage-group", group.manageGroup);
  router.delete("/delete-group", group.deleteGroup);

  // Bank Management
  router.get("/get-bank", bank.getBank);
  router.get("/get-admin-bank", bank.getAdminBank);
  router.post("/manage-bank", bank.manageBank);
  router.delete("/delete-bank", bank.deleteBank);

  // Department Management
  router.get("/get-department", department.getDepartment);
  router.get("/get-admin-department", department.getAdminDepartment);
  router.post("/manage-department", department.manageDepartment);
  router.delete("/delete-department", department.deleteDepartment);

  // Shift Management
  router.get("/get-shift", shift.getShift);
  router.get("/get-admin-shift", shift.getAdminShift);
  router.post("/manage-shift", shift.manageShift);
  router.delete("/delete-shift", shift.deleteShift);

  // Designation Management
  router.get("/get-designation", designation.getDesignation);
  router.get("/get-admin-designation", designation.getAdminDesignation);
  router.post("/manage-designation", designation.manageDesignation);
  router.delete("/delete-designation", designation.deleteDesignation);

  // Employment Management
  router.get("/get-employee", employee.getEmployee);
  router.post("/manage-employee", employee.manageEmploy);
  router.delete("/delete-employee", employee.deleteEmployee);
  router.post("/employee-report", employee.EmployeeReport);
  router.get("/get-employee-report", employee.GetEmployeeReport);

  // Salary Management
  router.get("/get-salary", salary.getSalary);
  router.post("/manage-salary", salary.manageSalary);
  router.delete("/delete-salary", salary.deleteSalary);
  router.post("/employee-salary", salary.employeeSalary);

  // Wokring Day Management
  router.get("/get-workday", workday.getWorkDay);
  router.post("/manage-workday", workday.manageWorkDay);
  router.delete("/delete-workday", workday.deleteWorkDay);

  // Monthly Attendance
  router.get("/get-monthly-attendance", monthlyAttendance.getMonthlyAttendance);
  router.post("/manage-monthly-attendance", monthlyAttendance.manageMonthlyAttendance);
  router.delete("/delete-monthly-attendance", monthlyAttendance.deleteMonthlyAttendance);

  // Daily Attendance
  router.get("/get-admin-daily-attendance", dailyAttendance.getAdminDailyAttendance);
  router.get("/get-daily-attendance", dailyAttendance.getDailyAttendance);
  router.post("/manage-daily-attendance", dailyAttendance.manageDailyAttendance);
  router.delete("/delete-daily-attendance", dailyAttendance.deleteDailyAttendance);
  router.post("/daily-attendance-report", dailyAttendance.dailyAttendanceReport);

  router.post("/get-project-attendance", dailyAttendance.getProjectAttenance)

  // Earning Management
  router.get("/get-earning", earning.getEarning);
  router.post("/manage-earning", earning.manageEarning);
  router.delete("/delete-earning", earning.deleteEarning);

  // Deduction Management
  router.get("/get-deduction", deduction.getDeduction);
  router.post("/manage-deduction", deduction.manageDeduction);
  router.delete("/delete-deduction", deduction.deleteDeduction);

  // Loan Management
  router.get("/get-loan", loan.getLoan);
  router.post("/manage-loan", loan.manageLoan);
  router.delete("/delete-loan", loan.deleteLoan);

  // Holiday Management
  router.get("/get-holiday", holiday.getHoliday);
  router.post("/manage-holiday", holiday.manageHoliday);
  router.delete("/delete-holiday", holiday.deleteHoliday);

  // Authorized Person
  router.get("/get-authorized-person", auth_person.getAuhPerson);
  router.get("/get-admin-authorized-person", auth_person.getAdminAuhPerson);
  router.post("/manage-authorized-person", auth_person.manageAuthPerson);
  router.delete("/delete-authorized-person", auth_person.deleteAuthPerson);

  // Year
  router.get("/get-year", year.getYear);
  router.get("/get-admin-year", year.getAdminYear);
  router.post("/manage-year", year.manageYear);
  router.delete("/delete-year", year.deleteYear);

  // user
  router.get("/get-user", user.getUser);
  router.post("/manage-user", user.manageUser);
  router.delete("/delete-user", user.deleteUser);

  // store
  router.get("/get-store", store.getStore);
  router.get("/get-admin-store", store.getAdminStore);
  router.post("/manage-store", store.manageStore);
  router.delete("/delete-store", store.deleteStore);

  //skill
  router.get("/get-skill", skill.getSkill);
  router.get("/get-admin-skill", skill.getAdminSkill);
  router.post("/manage-skill", skill.manageSkill);
  router.delete("/delete-skill", skill.deleteSkill);

  //Employee Type
  router.get("/get-employee-type", employeeType.getEmployeeType);
  router.get("/get-admin-employee-type", employeeType.getAdminEmployeeType);
  router.post("/manage-employee-type", employeeType.manageEmployeeType);
  router.delete("/delete-employee-type", employeeType.deleteEmployeeType);

  // Store ============================================================================================

  router.get("/get-role", role.getRole);
  router.get("/get-admin-role", role.getAdminRole);
  router.post("/manage-role", role.manageRole);
  router.delete("/delete-role", role.deleteRole);

  router.get("/get-unit", unit.getUnit);
  router.get("/get-admin-unit", unit.getAdminUnit);
  router.post("/manage-unit", unit.manageUnit);
  router.delete("/delete-unit", unit.deleteUnit);

  // Item Category
  router.get("/get-itemCategory", itemCategory.getCategory);
  router.get("/get-admin-itemCategory", itemCategory.getAdminCategory);
  router.post("/manage-itemCategory", itemCategory.manageItemCategory);
  router.delete("/delete-itemCategory", itemCategory.deleteItemCategory);

  // Inventory Location
  router.get("/get-inventoryLocation", inventoryLocation.getInventoryLocation);
  router.get(
    "/get-admin-inventoryLocation",
    inventoryLocation.getAdminInventoryLocation
  );
  router.post(
    "/manage-inventoryLocation",
    inventoryLocation.manageInventoryLocation
  );
  router.delete(
    "/delete-inventoryLocation",
    inventoryLocation.deleteInventoryLocation
  );


  // Supplier
  router.get("/get-supplier", supplier.getSuppliers);
  router.post("/manage-supplier", supplier.manageSupplier);
  router.delete("/delete-supplier", supplier.deleteSupplier);

  // Client
  router.get("/get-client", client.getClients);
  router.get("/get-admin-client", client.getAdminClients);
  router.post("/manage-client", client.manageClient);
  router.delete("/delete-client", client.deleteClient);

  // Project
  router.get("/get-project", project.getProjects);
  router.post("/manage-project", project.manageProject);
  router.delete("/delete-project", project.deleteProject);

  // Transport
  router.get("/get-transport", transport.getTransport);
  router.get("/get-admin-transport", transport.getAdminTransport);
  router.post("/manage-transport", transport.manageTransport);
  router.delete("/delete-transport", transport.deleteTransport);

  // Customer details for Sales Order
  router.get("/get-customer", customer.getCustomers);
  router.post("/manage-customer", customer.manageCustomer);
  router.delete("/delete-customer", customer.deleteCustomer);

  router.get("/get-party", party.getParty);
  router.get("/get-admin-party", party.getAdminParty);
  router.post("/manage-party", party.manageParty);
  router.delete("/delete-party", party.deleteParty);

  router.get("/get-party-tag", partyTag.getPartyTag);
  router.post("/manage-party-tag", partyTag.managePartyTag);
  router.delete("/delete-party-tag", partyTag.deletePartyTag);

  router.get("/get-party-group", partyGroup.getPartyGroup);
  router.get("/get-admin-party-group", partyGroup.getAdminPartyGroup);
  router.post("/manage-party-group", partyGroup.managePartyGroup);
  router.delete("/delete-party-group", partyGroup.deletePartyGroup);

  router.get("/get-item", item.getItem);

  // ERP ===============================================================================================
  router.get("/get-erprole", erpRoles.getErpRole);
  router.post("/manage-erprole", erpRoles.manageErpRole);
  router.delete("/delete-erprole", erpRoles.deleteErpRole);

  router.get("/get-project", project.getProjects);
  router.get("/get-admin-project", project.getAdminProjects);
  router.post("/manage-project", project.manageProject);
  router.delete("/delete-project", project.deleteProject);

  router.post("/get-store-request", request.getStoreRequest);
  router.post("/get-request", request.getRequest);
  router.post("/verify-request", request.verifyRequestStatus);
  router.post("/get-store-request-item", request.downloadOneRequestItem);

  router.get("/get-contractor", contractor.getContractor);
  router.post("/manage-contractor", contractor.manageContractor);
  router.delete("/delete-contractor", contractor.deleteContractor);

  router.get('/get-project-location', ProjectLocation.getProjectLocation);

  // User permission ===================================================================================
  router.post("/manage-user-permission", userperm.manageUserPermission);
  router.delete("/delete-user-permission", userperm.deleteUserPermission);
  router.get("/get-alluser-permission", userperm.getAllUserPermission);


  // Main Store===================================================================================
  router.post('/list-pr', transaction.listPRAdmin);
  router.post('/one-pr', transaction.onePR);
  router.post('/approve-one-pr', transaction.approvePR);
  router.put('/delete-pr-item', transaction.deletePRItem);

  router.post('/list-pr-admin', transaction.listPR);
  router.post('/list-po', transaction.listPO);
  router.post('/list-pu', transaction.listPU);
  router.post('/list-pur', transaction.listPUR);
  router.post('/list-iss', transaction.listISS);
  router.post('/list-isr', transaction.listISR);

  router.post('/one-pr', transaction.onePR);
  router.post('/one-po', transaction.onePO);
  router.post('/one-pu', transaction.onePU);
  router.post('/one-pur', transaction.onePUR);
  router.post('/one-iss', transaction.oneISS);
  router.post('/one-isr', transaction.oneISR);

  router.post('/pr-download-pdf', transaction.PRDownloadPDF);
  router.post('/po-download-pdf', transaction.PODownloadPDF);
  router.post('/pu-download-pdf', transaction.PUDownloadPDF);
  router.post('/pur-download-pdf', transaction.PURDownloadPDF);
  router.post('/iss-download-pdf', transaction.ISSDownloadPDF);
  router.post('/isr-download-pdf', transaction.ISRDownloadPDF);

  router.post('/iss-sort-download-pdf', transaction.ISSDownloadWithoutAmtPDF);
  router.post('/iss-long-download-pdf', transaction.ISSDownloadWithAmtPDF);
  router.post('/isr-sort-download-pdf', transaction.ISRDownloadWithoutAmtPDF);
  router.post('/isr-long-download-pdf', transaction.ISRDownloadWithAmtPDF);

  router.post("/ms-stock", msStock.MSstockList);


  // PMS Stock =================================================================

  router.get("/get-stock-list", pmsStock.getStockList);
  router.post("/download-stock-list", pmsStock.downloadStockItem);
  router.post("/stock-list-xlsx", pmsStock.xlsxStockItem);

  // PMS Dashboard ========================================================

  router.post("/get-pms-dashboard", user.pmsStore);
  router.post("/get-project-in-ex", project.getProjectIncomeExpense);
  router.post("/get-current-project-in-ex", project.getProjectCurruentMonth);
  router.post("/get-last_date-project-in-ex", project.getProjectLastDate);


  app.use("/api/admin", router);
};
