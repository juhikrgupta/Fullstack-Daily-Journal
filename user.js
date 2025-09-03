import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema = new mongoose.Schema({
  username: String, // used as email or unique id
  password: String,
});

userSchema.plugin(passportLocalMongoose);

export default mongoose.model("User", userSchema);
