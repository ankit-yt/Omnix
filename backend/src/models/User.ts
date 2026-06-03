import mongoose, { Document, Schema } from "mongoose";
import bcrypt from 'bcryptjs'
import { softDeletePlugin } from "@/models/base/softDelete";
import Organization from "@/models/Organization";
export interface IUser extends Document{
  name:string,
  email:string,
  password:string,
  role:'admin' | 'employee',
  organization:mongoose.Types.ObjectId,
  isActive:boolean,
  isEmailVerified:boolean,
  emailVerificationToken:string | undefined
  passwordResetToken:string | undefined
  passwordResetExpires:Date | undefined

  loginAttemps:number
  lockUntil:Date | undefined
  refreshToken:string | undefined
  lastLogin:Date
  createdBy: mongoose.Types.ObjectId
  isDeleted: boolean
  deletedAt:Date
  createdAt:Date
  updatedAt:Date
  
  comparePassword(candidatePassword:string) : Promise<string>
  isLocked(): boolean
  incrementLoginAttempts(): Promise<void>

}

const UserSchema = new Schema<IUser>({
  name:{
    type:String,
    required:[true , "Name is required"],
    trim:true
  },
  email:{
    type:String,
    required:[true, 'Email is required'],
    trim:true,
    lowercase:true,
    unique:true,
    match:[
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please Provide a valid email'
    ]
  },
  password:{
    type:String,
    required:[true , 'Password is required'],
    minLength:[8 , 'Password must be at least 8 characters'],
    select:false
  },
  role:{
    type:String,
    enum:['admin','employee'],
    default:'employee'
  },
  organization:{
    type:Schema.Types.ObjectId,
    ref:'Organization',
    required:true,
  },
  isActive:{
    type:Boolean,
    default:true
  },
  isEmailVerified:{type:Boolean , default:false},
  emailVerificationToken:{type:String , select:false},

  passwordResetToken:{type:String , select:false},
  passwordResetExpires:{type:Date , select:false},

  loginAttemps:{type:Number , default:0},
  lockUntil:{type:Date , select:false},

  refreshToken:{type:String , select:false},

  lastLogin:{type:Date},
  createdBy:{type:Schema.Types.ObjectId , ref:'User'},             
},{
  timestamps:true,
  toJSON:{
    transform(doc , ret){
      const {password , refreshToken , emailVerificationToken , passwordResetToken , loginAttemps , lockUntil , __v , ...safeObject} = ret
      return safeObject;
    }
  }
})

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password , 12)
})

UserSchema.methods.comparePassword = async function(candidatePassword:string):Promise<boolean>{
  return await bcrypt.compare(candidatePassword , this.password)
}

UserSchema.methods.isLocked = function():boolean{
  return !!(this.lockUntil &&  this.lockUntil > new Date())
}

UserSchema.methods.incrementLoginAttempts = async function(){
  const MAX_ATTEMPTS = 5
  const LOCK_TIME = 60
  this.loginAttemps += 1
  if(this.loginAttemps >= MAX_ATTEMPTS){
    this.lockUntil = new Date(Date.now() + LOCK_TIME)
  }

  await this.save()
}

UserSchema.plugin(softDeletePlugin)
UserSchema.index({email:1 , Organization:1})

export default mongoose.model<IUser>('User' , UserSchema)