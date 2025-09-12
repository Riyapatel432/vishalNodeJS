module.exports = (app) => {

    var router = require("express").Router();

    const { userTokenValidator } = require('../helper/index');

    router.use(userTokenValidator);

    const unit = require('../controllers/store/unit.controller');
    const item = require('../controllers/store/item.controller');

    router.post('/manage-unit', unit.manageUnit);
    router.get('/get-unit', unit.getUnit);
    router.delete('/delete-unit',unit.deleteUnit);

    // Item Details
    router.get('/get-item', item.getItem);
    router.post('/manage-item', item.manageItem);
    router.delete('/delete-item', item.deleteItem);
    


    app.use('/api/store', router);

}