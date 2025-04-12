import fs from 'fs';
import path from 'path';
import Video from '../models/video.model.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mergeIntervals = (intervals) => {
    if (intervals.length <= 1) return intervals;
    
    intervals.sort((a, b) => a.start - b.start);
    const merged = [intervals[0]];
    
    for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1];
        const current = intervals[i];
        
        if (current.start <= last.end) {
            last.end = Math.max(last.end, current.end);
        } else {
            merged.push(current);
        }
    }
    
    return merged;
};

export const streamVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        console.log('Streaming video:', videoId);
        
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Get the absolute path by joining the base directory path with the video url
        // Go up 4 levels from current file: src/features/videos/controllers -> backend root
        const baseDir = path.join(__dirname, '../../../../');
        // Normalize the video.url to use correct path separators for the OS
        const relativePath = video.url.split(/[\/\\]/).join(path.sep);
        const videoPath = path.join(baseDir, relativePath);
        
        console.log('Base directory:', baseDir);
        console.log('Relative path:', relativePath);
        console.log('Full video path:', videoPath);

        if (!fs.existsSync(videoPath)) {
            console.error('Video file not found at path:', videoPath);
            return res.status(404).json({
                success: false,
                message: 'Video file not found'
            });
        }

        const videoSize = fs.statSync(videoPath).size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
            const chunkSize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${videoSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': videoSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({
            success: false,
            message: 'Error streaming video',
            error: error.message
        });
    }
};

export const createVideo = async (req, res) => {
    try {
        const { title, description, url, duration, thumbnail } = req.body;
        
        if (!title || !url || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Title, URL, and duration are required'
            });
        }

        const video = new Video({ 
            title, 
            description, 
            url, 
            duration, 
            thumbnail 
        });
        
        await video.save();
        
        res.status(201).json({
            success: true,
            message: 'Video created successfully',
            video
        });
    } catch (error) {
        console.error('Error creating video:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating video',
            error: error.message 
        });
    }
};

export const getVideos = async (req, res) => {
    console.log("getVideos controller called");
    console.log("Request headers:", req.headers);
    console.log("Request query:", req.query);
    console.log("Request params:", req.params);
    
    try {
        console.log("Fetching videos from database...");
        const videos = await Video.find().sort({ createdAt: -1 });
        console.log("Found videos:", videos);
        
        if (!videos || videos.length === 0) {
            console.log("No videos found in database");
        }
        
        res.json({
            success: true,
            videos
        });
    } catch (error) {
        console.error('Error fetching videos:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching videos',
            error: error.message 
        });
    }
}
export const getVideoByID = async (req, res) => {
   try {
    const { id } = req.params;
    const video = await Video.findById(id);
    res.json(video);
   } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
        success: false,
        message: 'Error fetching video',
        error: error.message
    });
   }        
}; 