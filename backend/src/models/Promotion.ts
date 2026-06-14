import { auditPlugin, softDeletePlugin } from "@/models/base/plugins";
import mongoose, { Document, Schema } from "mongoose";

export interface IPromotion extends Document{
  name:string;
  discountPercentage:number;
  applicablePlans:mongoose.Types.ObjectId[];
  validFrom:Date;
  ValidUntil:Date;
  createdAt:Date;
  updatedAt:Date;
  createdBy:mongoose.Types.ObjectId;
  updatedBy:mongoose.Types.ObjectId;
}

const PromotionSchema = new Schema<IPromotion>({
  name:{
    type:String,
    required:true,
    trim:true
  },
  discountPercentage:{
    type:Number,
    required:true,
    min:1,
    max:100,
  },
  applicablePlans:{
    type:[Schema.Types.ObjectId],
    ref:'Plan',
    required:true
  },
  validFrom:{
    type:Date,
    required:true
  },
  ValidUntil:{
    type:Date,
    required:true
  },
},{
  timestamps:true,
  toJSON:{
    transform(doc , ret){
      const {__v , ...safeJson} = ret;
      return safeJson;
    }
  }
})

PromotionSchema.plugin(softDeletePlugin)
PromotionSchema.plugin(auditPlugin)
PromotionSchema.index({ validFrom: 1, validUntil: 1 });
PromotionSchema.index({ applicablePlans: 1 })

export default mongoose.model<IPromotion>('Promotion',PromotionSchema)