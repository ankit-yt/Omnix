import { Schema} from "mongoose";

export const softDeletePlugin = (schema:Schema)=>{
  schema.add({
    isDeleted:{type:Boolean , default:false , index:true},
    deletedAt:{type:Date , default:null}
  })

  schema.pre(/^find/, function(this:any,next:(err?:any)=>void){
    if(!this.getQuery.includeDeleted){
      this.where({isDeleted:false})
    }
    next();
  })

  schema.methods.softDelete = async function(){
    this.isDeleted = true,
    this.deletedAt = new Date(),
    await this.save()
  }
}



export const auditPlugin = (schema:Schema)=>{
  schema.add({
    createdBy:{
      type:Schema.Types.ObjectId,
      ref:'User'
    },
    updatedBy:{
      type:Schema.Types.ObjectId,
      ref:'User'
    }
  })
}