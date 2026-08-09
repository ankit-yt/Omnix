import mongoose, { Document, Schema } from "mongoose";
import { softDeletePlugin } from "@/models/base/plugins.js";
import { ISoftDelete } from "@/models/base/types.js";

export interface IChatSession extends ISoftDelete {
  _id?: mongoose.Types.ObjectId;

  organization: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  visitorId: string;
  title: string;

  page: {
    url: string;
    title: string;
  };

  client: {
    userAgent: string;
  };

  conversationSummary: string;

  messageCount: number;

  totalTokenUsed: number;

  lastActivityAt: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface IChatSessionDoc extends Omit<IChatSession, "_id">, Document { }

const ChatSessionSchema = new Schema<IChatSessionDoc>({
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  workspace: {
    type: Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  
  visitorId: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  title: {
    type: String,
    default: "New Chat",
    trim: true,
    maxlength: [150, "Title cannot exceed 150 characters"],
  },

  page: {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },
  },

  client: {
    userAgent: {
      type: String,
      default: "",
    },
  },

  conversationSummary: {
    type: String,
    default: "",
  },

  messageCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalTokenUsed: {
    type: Number,
    default: 0,
    min: 0,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
},
  {
    timestamps: true,

    toJSON: {
      transform(doc, ret) {
        const { __v, ...safeJson } = ret;
        return safeJson;
      },
    },
  }
);


ChatSessionSchema.plugin(softDeletePlugin);

ChatSessionSchema.index({
  organization: 1,
  workspace: 1,
  createdAt: -1,
});

ChatSessionSchema.index({
  organization: 1,
  workspace: 1,
  lastActivityAt: -1,
});

ChatSessionSchema.index({
  workspace: 1,
  visitorId: 1,
  lastActivityAt: -1,
});

export default mongoose.model<IChatSessionDoc>('ChatSession', ChatSessionSchema);