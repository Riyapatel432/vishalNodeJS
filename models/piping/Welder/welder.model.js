const mongoose = require("mongoose");
const { Schema } = mongoose;

const welderSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    welderNo: {
      type: String,
      required: true,
    },
    wpsNo: {
      type: Schema.Types.ObjectId,
      ref: 'WPS',
      required: true,
    },
    jointType: [
      {
        jointId: {
          type: Schema.Types.ObjectId,
          ref: 'joint-type',
        },
      },
    ],

    MinimumThickness: {
      type: Number,
      required: true,
    },
    MaximumThickness: {
      type: Number,
      required: true,
    },
    weldingProcess: {
      type: String,
      required: true,
    },
    QualifiedDiametermin: {
      type: String,
      required: true,
    },
    QualifiedDiametermax: {
      type: String,
      required: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
    pdf: { 
      type: String, 
      required: true 
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Optional: helper method to soft delete
welderSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Optional: static method to find non-deleted documents
welderSchema.statics.findActive = function(filter = {}) {
  return this.find({ deletedAt: null, ...filter });
};

module.exports = mongoose.model("piping_welder", welderSchema);
