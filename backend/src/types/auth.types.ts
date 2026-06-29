import { IOrganization } from "@/models/Organization.js";
import { IUser } from "@/models/User.js";

export interface RegisterInput{
  name:string;
  email:string;
  password:string;
  organizationName:string;
  website : string;
  contactEmail:string;

}

export interface AuthResult{
  accessToken:string,
  data:{
    user:IUser;
    organization?:IOrganization;
    rawApiKey?:string
  }
}