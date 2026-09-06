import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IColumn extends Document {
  boardId: mongoose.Types.ObjectId;
  title: string;
  taskIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Column must belong to a board'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Column title is required'],
      trim: true,
      maxlength: [60, 'Column title cannot exceed 60 characters'],
    },
    taskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
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

export const Column =
  (mongoose.models.Column as Model<IColumn>) ||
  mongoose.model<IColumn>('Column', ColumnSchema);
