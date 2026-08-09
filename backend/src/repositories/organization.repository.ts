import { Organization } from "@/models/base/index.js";
import { IOrganization, IOrganizationDoc, ISubscriptionCacheUpdate } from '@/models/base/types.js'
import { ClientSession, UpdateQuery } from "mongoose";
class OrganizationRepository {

  async findById(organizationId: string): Promise<IOrganization | null> {
    return Organization.findById(organizationId).select('cachedLimits cachedUsage onboardingStatus').lean();
  }

  async findByWebsite(website: string): Promise<IOrganization | null> {
    return Organization.findOne({ website }).lean();
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    return Organization.findOne({ slug }).lean();
  }

  async findByApiKey(apiKey: string): Promise<IOrganization | null> {
    return Organization.findOne({ apiKey }).select('+apiKey').lean();
  }

  async create(data: Partial<IOrganization>, session: ClientSession): Promise<IOrganizationDoc> {
    const [organization] = await Organization.create([data], { session });
    return organization;
  }

  async updateSubscriptionCache(orgId: string, data: ISubscriptionCacheUpdate, session?: ClientSession): Promise<void> {
    await Organization.findByIdAndUpdate(orgId, { $set: data }, { session })
  }

  async update(organizationId: string, data: UpdateQuery<IOrganizationDoc>, session?: ClientSession): Promise<void> {
    await Organization.findByIdAndUpdate(
      organizationId,
      { $set: data },
      { session }
    );
  }

  //Increment by one
  async incrementWorkspaceCount(orgId: string, session?: ClientSession): Promise<void> {
    await Organization.updateOne({ _id: orgId }, { $inc: { "cachedUsage.totalWorkspaces": 1 }, }, { session });
  }

  //Incement/Decremnt by dynamic amount
  async updateWorkspaceCount(organizationId: string, amount: number, session?: ClientSession): Promise<void> {
    await Organization.updateOne(
      { _id: organizationId },
      {
        $inc: {
          "cachedUsage.totalWorkspaces": amount,
        },
      }, { session }
    );
  }

  async updateDocumentSize(organizationId: string, amount: number, session?: ClientSession): Promise<void> {
    await Organization.updateOne(
      { _id: organizationId },
      {
        $inc: { 'cachedUsage.usedKnowledgeBaseSizeMB': amount }
      }, {
      session
    }
    );
  }

  //Record a message being sent
  async recordMessageUsage(organizationId: string, session?: ClientSession): Promise<void> {
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        $inc: {
          'cachedUsage.messagesThisMonth': 1,
          'cachedUsage.totalMessages': 1
        }
      },
      { session }
    );
  }

  // One-time flag update for onboarding
  async markFirstMessageCompleted(organizationId: string, session?: ClientSession): Promise<void> {
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        $set: {
          'onboardingStatus.firstSuccessfulMessage': true
        }
      },
      { session }
    );
  }

  async updateOnboardingStep(
    organizationId: string,
    step: keyof IOrganization['onboardingStatus'],
    session?: ClientSession
  ): Promise<void> {

    const query = Organization.findById(organizationId);


    if (session) {
      query.session(session);
    }

    const organization = await query;

    if (!organization) {
      return;
    }

    // completedAt should not be directly updated
    if (step === 'completedAt') {
      return;
    }

    organization.onboardingStatus[step] = true as never;

    const onboarding = organization.onboardingStatus;

    const isCompleted =
      onboarding.knowledgeBaseUploaded &&
      onboarding.firstSuccessfulMessage;

    onboarding.completedAt = isCompleted ? new Date() : null;

    await organization.save({ session });
  }
}

export default new OrganizationRepository();