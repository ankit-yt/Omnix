import { Organization } from "@/models/base/index.js";
import { IOrganization, IOrganizationDoc, ISubscriptionCacheUpdate } from '@/models/base/types.js'
import { ClientSession } from "mongoose";
class OrganizationRepository{

  async findByWebsite(website:string):Promise<IOrganization | null>{
    return Organization.findOne({website}).lean();
  }

  async findBySlug(slug:string):Promise<IOrganization | null>{
    return Organization.findOne({slug}).lean();
  }

  async findByApiKey(apiKey:string):Promise<IOrganization | null>{
    return Organization.findOne({apiKey}).select('+apiKey').lean();
  }

  async create(data:Partial<IOrganization>,session:ClientSession):Promise<IOrganizationDoc>{
    const [organization] = await Organization.create([data],{session});
    return organization;
  }

  async updateSubscriptionCache(orgId:string,data:ISubscriptionCacheUpdate,session?:ClientSession):Promise<void>{
    await Organization.findByIdAndUpdate(orgId ,{$set:data},{session})
  }
}

export default new OrganizationRepository();