import { Chunk, Workspace } from "@/models/base/index.js";
import { IChunk, IChunkDoc } from "@/models/base/types.js";
import mongoose, { ClientSession } from "mongoose";

class ChunkRepository {

  async createMany(chunks: IChunk[], session?: ClientSession): Promise<IChunkDoc[]> {
    return await Chunk.insertMany(chunks, { session });
  }

  async findSimilarChunks(workspaceId: string, queryVector: number[], limit: number = 5): Promise<IChunkDoc[]> {
    console.log(workspaceId)
    const pipeLine = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: limit * 10,
          limit: limit,
          filter: {
            workspace: new mongoose.Types.ObjectId(workspaceId)
          }
        }
      }, {
        $project: {
          embedding: 0,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]

    return await Chunk.aggregate(pipeLine);
  }
}

export default new ChunkRepository();