const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemPipingSchema = new Schema(
  {

   item_category: {
        type: Schema.Types.ObjectId,
        ref: 'piping-item-detail-category',
        required: true,
    },
     uom: {
        type: Schema.Types.ObjectId,
        ref: 'piping-item-uom',
        required: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    item_description: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    thickness: {
      type: Number,
      required: true,
    },
    material_grade: {
      type: String,
      required: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: 'bussiness-projects',
    },
    status: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("piping-items", itemPipingSchema);
