const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Status } = require('../../../../../utils/enum');

const finalCoatOfferSchema = new Schema({
    final_coat_no: {
        type: String,
    },
    paint_system_id: {
        type: Schema.Types.ObjectId,
        ref: 'painting-system',
        default: null
    },
    items: {
        type: [{
            drawing_id: {
                type: Schema.Types.ObjectId,
                ref: 'erp-planner-drawing',
                required: true,
            },
            grid_id: {
                type: Schema.Types.ObjectId,
                ref: 'erp-drawing-grid',
                required: true,
            },
            dispatch_id: {
                type: Schema.Types.ObjectId,
                ref: 'multi-erp-painting-dispatch-notes',
                required: false,
            },
            main_id: {
                type: Schema.Types.ObjectId,
                ref: 'multi-erp-mio-inspections',
                required: true,
            },
            fc_balance_grid_qty: {
                type: Number,
                default: 0
            },
            fc_used_grid_qty: {
                type: Number,
                default: 0
            },
            moved_next_step: {
                type: Number,
                default: 0
            },
            remarks: {
                type: String,
            },
        }],
    },
}, { timestamps: true });

module.exports = mongoose.model('multi-erp-final-coat-offer', finalCoatOfferSchema);
