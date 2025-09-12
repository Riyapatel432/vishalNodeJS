const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Status } = require('../../../../../utils/enum');

const surfacePrimerOfferSchema = new Schema({
    surface_no: {
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
            main_id: {
                type: Schema.Types.ObjectId,
                ref: 'multi-erp-painting-dispatch-notes',
                required: true,
            },
            surface_balance_grid_qty: {
                type: Number,
                default: 0
            },
            surface_used_grid_qty: {
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

module.exports = mongoose.model('multi-erp-surface-offer', surfacePrimerOfferSchema);
