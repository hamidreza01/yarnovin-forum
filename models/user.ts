import { Schema, model } from "mongoose";
const u = new Schema({
  name: Schema.Types.String,
  username: { type: Schema.Types.String, required: false },
  userid: { type: Schema.Types.String, required: true },
});
export default model("user", u, "user");
