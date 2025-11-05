const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define sub-schema for each joint entry inside material_items
const jointMaterialItemSchema = new Schema({
  material_item_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "piping-drawing-material-items",
      required: true,
    },
  ],
  joint_no: {
    type: String,
    required: true,
    trim: true,
  },
  joint_type: {
    type: Schema.Types.ObjectId,
    ref: "piping-joint-type",
    required: true,
  },
});

const jointWiseEntrySchema = new Schema(
  {
    drawing_id: {
      type: Schema.Types.ObjectId,
      ref: "piping-drawing",
      required: true,
    },
    project_id: {
      type: Schema.Types.ObjectId,
      ref: "bussiness-projects",
      required: true,
    },
    spool_no_id: {
      type: Schema.Types.ObjectId,
      ref: "piping-drawing-spool-no-joint-items",
      required: true,
    },

    // Array of material + joint details
    material_items: [jointMaterialItemSchema],

    area: {
      type: String,
      required: true,
    },
    inch_meter: {
      type: String,
      required: true,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Useful indexes
jointWiseEntrySchema.index({ project_id: 1, deleted: 1 });
jointWiseEntrySchema.index({ drawing_id: 1, spool_no_id: 1 });

// ✅ Prevent duplicate joint_no per drawing + spool
jointWiseEntrySchema.index(
  { drawing_id: 1, spool_no_id: 1, "material_items.joint_no": 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model(
  "piping-drawing-joint-items",
  jointWiseEntrySchema
);
