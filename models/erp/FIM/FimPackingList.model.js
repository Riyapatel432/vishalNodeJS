const mongoose = require("mongoose");
const { Schema } = mongoose;

const fimItemSchema = new mongoose.Schema(
  {
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "store-items", required: true  },   // Dropdown
    weight_as_per_list: { type: Number, required: true }, // (Kg)
    numbers_as_per_list: { type: Number, required: true },
    received_weight: { type: Number, default: 0 },
    received_length: { type: Number, default: 0 },       // (MM)
    received_width: { type: Number, default: 0 },        // (MM)
    received_nos: { type: Number, default: 0 },
    rejected_weight: { type: Number, default: 0 },
    rejected_length: { type: Number, default: 0 },       // (MM)
    rejected_width: { type: Number, default: 0 },        // (MM)
    rejected_nos: { type: Number, default: 0 },
    status: { type: Number, enum: [ 0, 1,2], default: 0 }, // 0: Pending, 1: Approved 2: Rejected
    remarks: { type: String }
  },
);

const fimPackingListSchema = new mongoose.Schema(
  {
    // ---------- Main FIM (Header / Master Data) ----------
    project: { type: mongoose.Schema.Types.ObjectId, ref: "bussiness-projects", required: true },
    packing_no: { type: String, required: true },
    packing_date: { type: Date, default: Date.now },
    rgp_no: { type: String },
    fim_lot_no: { type: String },
    returnable_type: { 
      type: String, 
      enum: ["Returnable", "Non-Returnable"], 
      required: true 
    },
    eway_bill: { type: String },
    vehicle_number: { type: String },
    supplier: { type: String, required: true },
    receiving_date: { type: Date, default: Date.now },
    received_by: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    items: [fimItemSchema],
    deleted: { type: Boolean, default: false },
    status: { type: Number, enum: [0,1, 2, 3], default: "0" }, // 0: Pending, 1: Send to QC, 2: Completed, 3: Rejected
    qc_by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    qc_timestamp: { type: Date },
    send_to_qc: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Use module.exports for CommonJS syntax
module.exports = mongoose.model("FimPackingList", fimPackingListSchema);
