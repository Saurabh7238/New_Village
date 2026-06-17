import mongoose from "mongoose";
import { BUDGET_STATUSES } from "@/lib/budgetDisplay";

const BudgetSchema = new mongoose.Schema(
  {
    financialYear: { type: String, required: true },
    schemeName: { type: String, required: true },
    totalAllocation: { type: Number, required: true, default: 0 },
    amountReceived: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: BUDGET_STATUSES,
      default: "Planned",
    },
    workDescription: { type: String, default: "" },
    startDate: { type: Date },
    endDate: { type: Date },
    beneficiaryCount: { type: Number, default: 0 },
    documentData: { type: String },
    documentName: { type: String },
    documentMimeType: { type: String, default: "application/pdf" },
  },
  { timestamps: true }
);

BudgetSchema.pre("save", function (next) {
  this.balance = (this.totalAllocation || 0) - (this.amountReceived || 0);
  next();
});

BudgetSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const $set = update.$set || update;

  if ($set.totalAllocation !== undefined || $set.amountReceived !== undefined) {
    const total =
      $set.totalAllocation !== undefined
        ? Number($set.totalAllocation)
        : undefined;
    const received =
      $set.amountReceived !== undefined
        ? Number($set.amountReceived)
        : undefined;

    if (total !== undefined && received !== undefined) {
      $set.balance = total - received;
    }
  }

  next();
});

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
