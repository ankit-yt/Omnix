import { Organization } from "@/types/organization.types";


export interface User {
  id: string;
  name: string;
  email: string;

  role: "admin" | "employee";

  organization: Organization;

  isActive: boolean;
  isEmailVerified: boolean;

  lastLogin?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput{
  name:string;
  email:string;
  password:string;
  organizationName:string;
  website : string;
  contactEmail:string;

}