import mongoose from "mongoose"

export interface IAuditFields {
  createdBy: mongoose.Types.ObjectId
  updatedBy: mongoose.Types.ObjectId | null
}