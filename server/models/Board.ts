import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBoard extends Document {
  title: string;
  owner: mongoose.Types.ObjectId;
  columnOrder: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: [100, 'Board title cannot exceed 100 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board must have an owner'],
      index: true,
    },
    columnOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Column',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Board =
  (mongoose.models.Board as Model<IBoard>) ||
  mongoose.model<IBoard>('Board', BoardSchema);
