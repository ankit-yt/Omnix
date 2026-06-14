import mongoose, { Document, Schema } from "mongoose";


interface ISubscriptionHistory{
  event:
  |'trail_started'
  |'activated'
  |'renewed'
  |'upgraded'
  |'cancelled'
  |'expired'
  |'reactivated'
  |'past_due',
  fromPlan:string;
  toPlan:string;
  fromStatus:string;
  toStatus:string;
  paymentOrder:mongoose.Types.ObjectId;
  occurredAt:Date;
  note:string
}

export interface ISubscription extends Document{
  organizationId : mongoose.Types.ObjectId;
  plan:'pro'|'enterprise';
  status:'active'|'past_due'|'cancelled'|'expired';
  currentPeriodStarts:Date;
  currentPeriodEnds:Date;
  trailStart:Date,
  trailEnd:Date,
  razorPaySubscriptionId:string;
  lockedLimit:{
    messagePerMonth:number;
    knowledgeBaseSizeMB:number;
    teamMembers:number;
  };
  history:ISubscriptionHistory[];
  payments:mongoose.Types.ObjectId[];
  lastPayment:mongoose.Types.ObjectId;
  cancelledAt:Date;
  cancellationReason:string;
  cancelAtPeriodEnd:boolean;
  createdAt:Date;
  updateAt:Date;
}

const PLAN_LIMITS = {
  
}

const subscriptionSchema = new Schema<ISubscription>({
  organizationId:{
    type:Schema.Types.ObjectId,
    ref:'Organization',
    required:true
  },
  plan:{
    type:String,
    enum:['pro','enterprise'],
    required:true
  },
  status:{
    type:String,
    enum:['active','past_due','cancelled','expired'],
    default:'active'
  },
  currentPeriodStarts:{
    type:Date,
    required:true
  },
  currentPeriodEnds:{
    type:Date,
    required:true
  }
},{
  timestamps:true,
   toJSON:{
    transform(doc,ret){
      const {__v , ...safeJson} = ret;
      return safeJson;
    }
  }
});


export default mongoose.model<ISubscription>('Subscription',subscriptionSchema)