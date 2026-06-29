
import { auditPlugin, softDeletePlugin } from "@/models/base/plugins.js";
import { IAudit, ISoftDelete } from "@/models/base/types.js";
import mongoose, { Document, Schema } from "mongoose";

export interface IPromotion extends ISoftDelete , IAudit{
  name:string;
  discountPercentage:number;
  applicablePlans:mongoose.Types.ObjectId[];
  validFrom:Date;
  validUntil:Date;
  createdAt:Date;
  updatedAt:Date;
}

export interface IPromotionDoc extends IPromotion , Document {};

const PromotionSchema = new Schema<IPromotionDoc>({
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
  validUntil:{
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

export default mongoose.model<IPromotionDoc>('Promotion',PromotionSchema)