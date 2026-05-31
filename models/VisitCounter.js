import mongoose from "mongoose";

const VisitCounterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: "site",
  },
  count: {
    type: Number,
    default: 0,
  },
});

const VisitCounter =
  mongoose.models.VisitCounter ||
  mongoose.model("VisitCounter", VisitCounterSchema);

export default VisitCounter;
