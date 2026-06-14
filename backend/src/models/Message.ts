import { softDeletePlugin } from '@/models/base/plugins'
import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  session: mongoose.Types.ObjectId
  organization: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  content: string
  metadata: {
    // what page was employee on when this message was sent
    pageUrl: string
    // what vision AI saw when it analyzed the screenshot
    screenshotAnalysis: string
    // which chunk IDs were used to answer this question
    // so we know which docs are actually being used
    sourceChunks: mongoose.Types.ObjectId[]
    // how many tokens this message consumed
    // user messages = 0, assistant messages = actual count
    tokensUsed: number
    // how long did AI take to respond in milliseconds
    responseTime: number
    // which AI model was used
    // future proofing — maybe we switch models per plan
    modelUsed: string
    // confidence score — how relevant were the found chunks
    // low score = AI was guessing, high = found good docs
    retrievalScore: number
  }
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: [1, 'Message content cannot be empty'],
    },
    metadata: {
      pageUrl: {
        type: String,
        default: '',
      },
      screenshotAnalysis: {
        type: String,
        default: '',
      },
      sourceChunks: {
        type: [Schema.Types.ObjectId],
        ref: 'Chunk',
        default: [],
      },
      tokensUsed: {
        type: Number,
        default: 0,
      },
      responseTime: {
        type: Number,
        default: 0,
      },
      modelUsed: {
        type: String,
        default: 'llama-3.3-70b-versatile',
      },
      retrievalScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        const {__v , ...safeJson} = ret
        return safeJson
      },
    },
  }
)


MessageSchema.index({ session: 1, createdAt: 1 })

MessageSchema.index({ organization: 1, createdAt: -1 })

MessageSchema.index({ organization: 1, 'metadata.tokensUsed': 1 })

export default mongoose.model<IMessage>('Message', MessageSchema)