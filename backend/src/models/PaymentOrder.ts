import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentOrder{
  organizationId : mongoose.Types.ObjectId;
  subscriptionId? : mongoose.Types.ObjectId;
  amount:number;
  currency:string;
  status:'pending'|'success'|'failed';
  paymentMethod:string;
  razorpaySubscriptionId:string;
  razorpayPaymentId?:string;
  errorMessage?:string;
  createdAt:Date;
  updatedAt:Date;
}

export interface IPaymentOrderDoc extends IPaymentOrder , Document {};

const PaymentOrderSchema = new Schema<IPaymentOrderDoc>({
  organizationId:{
    type:Schema.Types.ObjectId,
    ref:'Organization',
    required:true
  },
  subscriptionId:{
    type:Schema.Types.ObjectId,
    ref:'Subscription'
  },
  amount:{
    type:Number,
    required:true
  },
  currency:{
    type:String,
    default:'INR'
  },
  status:{
    type:String,
    enum:['pending','success','failed'],
    default:'pending'
  },
  paymentMethod:{
    type:String,
    default:'unknown'
  },
  razorpaySubscriptionId:{
    type:String,
    required:true,
    unique:true
  },
  razorpayPaymentId:{type:String},
  errorMessage:{type:String}
},{
  timestamps:true,
  toJSON:{
    transform(doc,ret){
      const {__v , ...safeJson} = ret;
      return safeJson;
    }
  }
})

export default mongoose.model<IPaymentOrderDoc>('PaymentOrder',PaymentOrderSchema);