import { Schema, model } from "mongoose";
const t = new Schema({
  from: { type: Schema.Types.ObjectId, required: true },
  topic: { type: [Schema.Types.String], required: true },
  title : {type: Schema.Types.String, required: true},
  description: { type: Schema.Types.String, required: true },
  answers: {
    type: [
      {
        from: Schema.Types.ObjectId,
        description: Schema.Types.String,
        timestamp: { type: Schema.Types.Number, default: () => Date.now() },
      },
    ],
    required: false,
  },
  timestamp: { type: Schema.Types.Number, default: () => Date.now() },
});
export default model("thread", t, "thread");
