import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubtask {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  title: string;
  completed: boolean;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface ITask extends Document {
  columnId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: TaskPriority;
  subtasks: ISubtask[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: [true, 'Subtask title is required'],
      trim: true,
      maxlength: [150, 'Subtask title cannot exceed 150 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  }
);

const TaskSchema = new Schema<ITask>(
  {
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: [true, 'Task must belong to a column'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true,
    },
    subtasks: [SubtaskSchema],
    dueDate: {
      type: Date,
      default: null,
    },
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

export const Task =
  (mongoose.models.Task as Model<ITask>) ||
  mongoose.model<ITask>('Task', TaskSchema);
