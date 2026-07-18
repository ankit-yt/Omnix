import mongoose, { ClientSession } from "mongoose";
import { PaymentOrder } from '@/models/base/index.js'
import { IPaymentOrder, IPaymentOrderDoc } from '@/models/base/types.js'

class PaymentOrderRepository{

  async create(data:Partial<IPaymentOrder>,session?:ClientSession):Promise<IPaymentOrderDoc>{
    const [order] = await PaymentOrder.create([data],{session});
    return order;
  }

  async findByrazorpaySubscriptionId(razorpaySubscriptionId:string):Promise<IPaymentOrderDoc |  null>{
    return await PaymentOrder.findOne({razorpaySubscriptionId}).lean();
  }

  async updatePaymentState(
    id:mongoose.Types.ObjectId | string,
    updateData:{
      status:'pending' | 'success' | 'failed';
      razorpayPaymentId?:string;
      paymentMethod?:string,
      errorMessage?:string;
    },
    session?:ClientSession
  ):Promise<IPaymentOrderDoc | null>{
    return await PaymentOrder.findByIdAndUpdate(
      id,
      {$set:updateData},
      {new:true,runValidators:true,session}
    );
  }
}

export default new PaymentOrderRepository();