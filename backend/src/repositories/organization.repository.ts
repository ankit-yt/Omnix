import { Organization } from "@/models/base/index.js";
import { IOrganization, IOrganizationDoc, ISubscriptionCacheUpdate } from '@/models/base/types.js'
import { ClientSession, UpdateQuery } from "mongoose";
class OrganizationRepository{

  async findById(organizationId:string):Promise<IOrganization | null>{
    return Organization.findById(organizationId).select('cachedLimits').lean();
  }

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

  async update(organizationId:string , data:UpdateQuery<IOrganizationDoc> , session?:ClientSession):Promise<void>{
    await Organization.findByIdAndUpdate(
      organizationId,
      {$set:data},
      {session}
    );
  }

  async incrementWorkspaceCount(orgId:string , session?:ClientSession):Promise<void>{
    await Organization.updateOne({_id:orgId},{$inc:{"cachedUsage.totalWorkspaces":1},},{session});
  }

  async updateWorkspaceCount(organizationId:string , amount:number , session?:ClientSession):Promise<void>{
    await Organization.updateOne(
      { _id:organizationId },
      { $inc:{
          "cachedUsage.totalWorkspaces":amount,
          },
      },{session}
  );
  }
}

export default new OrganizationRepository();