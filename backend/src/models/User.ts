import mongoose, { Document, Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import { softDeletePlugin, auditPlugin } from "@/models/base/plugins.js";
import { ISoftDelete, IAudit } from "@/models/base/types.js";

export interface IUser extends ISoftDelete, IAudit {
  _id?:mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  organization: mongoose.Types.ObjectId;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  loginAttempts: number; 
  lockUntil?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

export interface IUserDoc extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDoc>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please Provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },

  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  loginAttempts: { type: Number, default: 0 }, 
  lockUntil: { type: Date, select: false },

  refreshToken: { type: String, select: false },
  lastLogin: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      const { 
        password, 
        refreshToken, 
        emailVerificationToken, 
        passwordResetToken, 
        loginAttempts, 
        lockUntil, 
        __v, 
        ...safeObject 
      } = ret;
      return safeObject;
    }
  }
});

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.plugin(softDeletePlugin);
UserSchema.plugin(auditPlugin); 

UserSchema.index({ email: 1, organization: 1 });

export default mongoose.model<IUserDoc>('User', UserSchema);