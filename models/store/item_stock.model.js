const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemStockSchema = new Schema({
    requestId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'erp-request',
    },
    offerList: [{
        offerId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'erp-purchase-offer',
        },
    }],
    deleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true })

itemStockSchema.index({requestId: 1},{unique: true});

module.exports = mongoose.model('store-itemStock', itemStockSchema);