const mongoose = require('mongoose');
const { Schema } = mongoose;

const PurchaseRequestSchema = new Schema({

    firm_id: {
        type: Schema.Types.ObjectId,
        ref: "firm",
    },
    year_id: {
        type: Schema.Types.ObjectId,
        ref: "year",
    },
    requestNo: {
        type: Number,
    },
    storeLocation: {
        type: Schema.Types.ObjectId,
        ref: "erp-project-location",
    },
    drawing_id: {
        type: Schema.Types.ObjectId,
        ref: "erp-planner-drawing",
        default: null
    },
    drawingIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'erp-planner-drawing',
        }
    ],
    project: {
        type: Schema.Types.ObjectId,
        ref: 'bussiness-projects',
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: 'department',
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "admin",
    },
    preparedBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    material_po_no: {
        type: String,
    },
    tag: {
        type: Number, // purchase=1, sale=2 
    },
    requestDate: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    admin_approval_time: {
        type: Date,
        default: Date.now(),
    },
    status: {
        type: Number, // 1-Pending 2-Approved By Admin 3-Rejected By Admin 4-Completed // 5 all received
        default: 1,
    },
    deleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('erp-request', PurchaseRequestSchema);