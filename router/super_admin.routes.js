
module.exports = (app) => {
    var router = require("express").Router();

    const { superAdminTokenValidator } = require("../helper/index");

    router.use(superAdminTokenValidator);

    const superAdmin = require("../controllers/super_admin.controller");
    const draw = require("../controllers/erp/planner/draw.controller")


    router.post("/login", superAdmin.super_login);
    router.get("/get-super-admin-profile", superAdmin.getSuperAdminProfile);

    //Office use only
    // router.post("/create", superAdmin.createuser);


    // NEW DPR WITH GRID
    router.get('/get-grid-dpr', draw.dprGridReport);
    router.post('/download-grid-xlsx-dpr', draw.drpXlsxGridReport);

    // router.get("/get-profile", admin.getProfile);




    app.use("/api/super_admin", router);
};
