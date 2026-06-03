import { Schema} from "mongoose";

export const softDeletePlugin = (schema:Schema)=>{
  schema.add({
    isDeleted:{type:Boolean , default:false , index:true},
    deletedAt:{type:Date , default:null}
  })

  schema.pre(/^find/, function(this:any){
    if(!this.getQuery.includeDeleted){
      this.where({isDeleted:false})
    }
    
  })

  schema.methods.softDelete = async function(){
    this.isDeleted = true,
    this.deletedAt = new Date(),
    await this.save()
  }
}
