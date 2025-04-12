import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    walletBalance: {
      type: Number,
      default: 100,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    videos: [
      {
        videoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Video",
        },
        lastWatchTime: {
          type: Number,
          default: 0,
        },
        segmentsWatchedArrayHash: {
          type: [Number],
          default: [],
        },
      },
    ],
  },
  { collection: "userData" }
);

// Prevent model overwrite error
const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;