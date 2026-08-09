// src/repositories/workspace.repository.ts
import { ClientSession, UpdateQuery } from 'mongoose'
import { Workspace } from '@/models/base/index.js'
import { IWorkspace, IWorkspaceDoc } from '@/models/base/types.js'
import mongoose from 'mongoose'
import { UpdateWorkspaceDto } from '@/validators/workspace.validator.js'
import { UpdateCrawlingStatusDto } from '@/dtos/crawl.dto.js';
class WorkspaceRepository {

  async create(data: Partial<IWorkspace>, session?: ClientSession): Promise<IWorkspaceDoc> {
    const [workspace] = await Workspace.create([data], { session })
    return workspace
  }

  async findByOrganization(orgId: string): Promise<IWorkspace[]> {
    return Workspace.find({ organization: orgId }).lean()
  }

  async findById(workspaceId: string): Promise<IWorkspace | null> {
    return Workspace.findById(workspaceId).lean()
  }

  async findByIdToUpdate(workspaceId: string): Promise<IWorkspaceDoc | null> {
    return Workspace.findById(workspaceId)
  }


  async findByIdAndUpdate(workspaceId: string, data: UpdateWorkspaceDto, session?: ClientSession): Promise<IWorkspaceDoc | null> {
    return Workspace.findByIdAndUpdate(workspaceId, data, { returnDocument: 'after', runValidators: true, session });
  }

  async findByIdAndDelete(workspaceId: string, session?: ClientSession): Promise<IWorkspaceDoc | null> {
    return Workspace.findByIdAndDelete(workspaceId, { session });
  }

  async existsByOrganization(orgId: string): Promise<boolean> {
    const workspace = await Workspace.exists({ organization: orgId });
    return workspace != null;
  }

  async countByOrganization(orgId: string): Promise<number> {
    return Workspace.countDocuments({
      organization: orgId,
    })
  }

  async findDuplicateName(orgId: string, name: string, excludeWorkspaceId?: string): Promise<IWorkspace | null> {
    const filter: mongoose.QueryFilter<IWorkspaceDoc> = {
      organization: orgId,
      name,
    }

    if (excludeWorkspaceId) {
      filter._id = {
        $ne: new mongoose.Types.ObjectId(excludeWorkspaceId)
      }
    }

    return Workspace.findOne(filter).lean();
  }

  // Record a message usage for the workspace
  async recordMessageUsage(workspaceId: string, session?: mongoose.ClientSession): Promise<void> {
    await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        $inc: {
          'usage.messagesThisMonth': 1,
          'usage.totalMessages': 1
        }
      },
      { session }
    );
  }

  async updateCrawlingStatus(workspaceId: string, data: UpdateCrawlingStatusDto, session?: ClientSession): Promise<IWorkspaceDoc | null> {
    return Workspace.findByIdAndUpdate(
      workspaceId,
      {
        $set: {
          ...(data.status !== undefined && {
            "crawlingStatus.status": data.status,
          }),
          ...(data.lastCrawledAt !== undefined && {
            "crawlingStatus.lastCrawledAt": data.lastCrawledAt,
          }),
          ...(data.pagesCrawled !== undefined && {
            "crawlingStatus.pagesCrawled": data.pagesCrawled,
          }),
          ...(data.errorMessage !== undefined && {
            "crawlingStatus.errorMessage": data.errorMessage,
          }),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    );
  }

  async deactivateExcessWorkspaces(organizationId: string, session?: ClientSession): Promise<number> {
     const firstWorkspace = await Workspace.findOne(
      {
        organization: organizationId,
        isDeleted: false,
      },
      { _id: 1 }
    )
      .sort({ createdAt: 1 })
      .session(session ?? null);

    if (!firstWorkspace) {
      return 0;
    }

    const result = await Workspace.updateMany(
      {
        organization: organizationId,
        isDeleted: false,
        _id: { $ne: firstWorkspace._id },
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      },
      {
        session,
      }
    );

    return result.modifiedCount;
  }

  async activateAllWorkspaces(organizationId: string, session?: ClientSession): Promise<number> {
    const result = await Workspace.updateMany({
      organization: organizationId,
      isDeleted: false,
      isActive: false,
    }, {
      $set: {
        isActive: true,
      },
    }, {
      session,
    });

    return result.modifiedCount;
  }

}

export default new WorkspaceRepository()