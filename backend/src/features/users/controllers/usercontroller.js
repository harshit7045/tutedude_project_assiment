import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import pkg from 'jsonwebtoken';

import Course from "../../courses/model/coursesModel.js";
import Video from "../../videos/models/video.model.js";
const { sign } = pkg;

const userController = {
  createUser: async (req, res) => {
    const { email, password, name } = req.body;
    console.log(email, password, name);
    try {
      // Hash the user's password
      const hashedPassword = await bcrypt.hash(password, 10); // Use bcrypt to hash the password

      // Hardcoded courseId for testing
      const courseId = "unique_course_id_123";
      const course = await Course.findOne({ courseId });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Hardcoded videoId for testing
      const videoId = "67f9d396a23041a4337b6739";
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Create the user entry in the database
      const user = await userModel.create({
        email: email,
        password: hashedPassword,
        name: name,
        walletBalance: 100,
        courses: [course._id],
        videos: [
          {
            videoId: video._id,
            lastWatchTime: 0,
            segmentsWatchedArrayHash: new Array(Math.floor(video.duration / 5)).fill(0), // Segments hash dynamically
          }
        ],
      });

      // Return the created user as a response
      res.status(201).json(user);
    } catch (error) {
      // Debugging for errors
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message });
    }
  },
  updateUserViewvideo: async (req, res) => {
    // This function is deprecated, use updateUserViewVideo instead
    return res.status(400).json({ 
      success: false, 
      error: "This endpoint is deprecated. Please use updateUserViewVideo instead." 
    });
  },
  getlastWatchedTime: async (req, res) => {
    const { videoId } = req.body;
    const userIdOrEmail = req.user.user;
    try{
      console.log("aaaa"+ userIdOrEmail);
      const user = await userModel.findOne({_id:userIdOrEmail});
      if(!user){
        return res.status(404).json({error:"User not found"});
      }
      const videoEntry = user.videos.find(v => v.videoId.toString() === videoId);
      if(!videoEntry){
        return res.status(404).json({error:"Video not found in user's list"});
      }
      return res.status(200).json({
        success:true,
        lastWatchTime:videoEntry.lastWatchTime
      });   
    }catch(error){
      console.error('Error getting last watched time:', error);
      return res.status(500).json({
        success:false,
        error:"Failed to get last watched time"
      });
    }   
  },
  updateUserViewVideo: async (req, res) => {
    const { videoId, viewedSegments } = req.body;
    
    // Get user ID from the authenticated user
    const userIdOrEmail = req.user.user;
    
    try {
      // Find user by ID or email
      let user;
      if (userIdOrEmail.includes('@')) {
        // If it's an email, find by email
        user = await userModel.findOne({ email: userIdOrEmail });
      } else {
        // Otherwise, try to find by ID
        user = await userModel.findById(userIdOrEmail);
      }
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Find the video entry in user's videos array
      const videoEntry = user.videos.find(v => v.videoId.toString() === videoId);
      if (!videoEntry) {
        return res.status(404).json({ error: "Video not found in user's list" });
      }
      
      // Update the segments watched array - mark watched segments as 1
      viewedSegments.forEach(segmentIndex => {
        if (segmentIndex >= 0 && segmentIndex < videoEntry.segmentsWatchedArrayHash.length) {
          videoEntry.segmentsWatchedArrayHash[segmentIndex] = 1;
          // Update the last watched time based on the segment index
          videoEntry.lastWatchTime = segmentIndex * 5;
        }
      });

      // Save the updated user
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Video segments updated successfully",
        updatedSegments: videoEntry.segmentsWatchedArrayHash,
        lastWatchTime: videoEntry.lastWatchTime
      });

    } catch (error) {
      console.error('Error updating video segments:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to update video segments" 
      });
    }
  },
  getUserViewedSegments: async (req, res) => {
    const { videoId } = req.body;
    const userIdOrEmail = req.user.user;
    
    try {
      // Find user by ID or email
      let user;
      if (userIdOrEmail.includes('@')) {
        // If it's an email, find by email
        user = await userModel.findOne({ email: userIdOrEmail });
      } else {
        // Otherwise, try to find by ID
        user = await userModel.findById(userIdOrEmail);
      }
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find the video entry in user's videos array
      const videoEntry = user.videos.find(v => v.videoId.toString() === videoId);
      if (!videoEntry) {
        return res.status(404).json({ error: "Video not found in user's list" });
      }

      // Return the segments watched array
      return res.status(200).json({
        success: true,
        viewedSegments: videoEntry.segmentsWatchedArrayHash
      });

    } catch (error) {
      console.error('Error getting viewed segments:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to get viewed segments" 
      });
    }
  },
  

  signinUser: async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare the hashed password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT token with user ID instead of email
      const token = sign({ user: user._id }, process.env.SECRET_KEY, { expiresIn: "7d" });

      // Return token in a cookie
      return res.cookie('tokenjwt', token, { httpOnly: false, secure: false, sameSite: 'none' })
        .status(200)
        .send({ message: "Login Success", user: user, token: token });
    } catch (error) {
      console.error('Error signing in user:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getUser: async (req, res) => {
    console.log(req.user);
    const userId = req.user.user;
    try {
      // Find user by ID
      const user = await userModel.findById(userId).populate('courses videos.videoId');
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return user data
      return res.status(200).json({ 
        success: true, 
        user: user 
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return res.status(500).json({ error: error.message });
    }
  },
};

export default userController;