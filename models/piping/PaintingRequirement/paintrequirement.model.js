const mongoose = require("mongoose");
const { Schema } = mongoose;

const painringRequirementSchema = new Schema(
  {
    paint_class: {
      type: String,
      required: true,
    },
    piping_material_specifiation: {
      type: String,
      required: true,
    },
    blasting_painting_requirements: {
      type: String,
      required: true,
    },
    paint_system_no: {
      type: String,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Optional: helper method to soft delete
painringRequirementSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Optional: static method to find non-deleted documents
painringRequirementSchema.statics.findActive = function(filter = {}) {
  return this.find({ deletedAt: null, ...filter });
};

module.exports = mongoose.model("piping_painting_requirement", painringRequirementSchema);
