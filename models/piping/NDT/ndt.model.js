const mongoose = require("mongoose");
const { Schema } = mongoose;

const ndtSchema = new Schema(
  {
    piping_class: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    piping_material_specifiation: {
      type: String,
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
    BSRRT: {
      type: String,
      required: true,
    },
    Ferrite: {
      type: String,
      required: true,
    },
    PWHT: {
      type: String,
      required: true,
    },
    ASRRT: {
      type: String,
      required: true,
    },
    RT: {
      type: String,
      required: true,
    },
    MPL: {
      type: String,
      required: true,
    },
    LPT: {
      type: String,
      required: true,
    },
    Hardness: {
      type: String,
      required: true,
    },
    PMI: {
      type: String,
      required: true,
    },
    PicklingPassivation: {
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
ndtSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Optional: static method to find non-deleted documents
ndtSchema.statics.findActive = function(filter = {}) {
  return this.find({ deletedAt: null, ...filter });
};

module.exports = mongoose.model("piping_ndt", ndtSchema);
