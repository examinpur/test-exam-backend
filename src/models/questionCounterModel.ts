import mongoose from 'mongoose';

const questionCounterSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'questioncounters',
  },
);

questionCounterSchema.index({ _id: 1 });

export default mongoose.model('QuestionCounter', questionCounterSchema);

