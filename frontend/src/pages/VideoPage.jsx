import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VideoPlayer from '../components/VideoPlayer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VideoPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [watchedIntervals, setWatchedIntervals] = useState([]);
  const lastUpdateRef = useRef(0);
  const userId = localStorage.getItem('userId') || 'anonymous';

  // Fetch video details
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setVideo(response.data.video);
        } else {
          setError('Failed to fetch video');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, navigate]);

  // Track video progress
  useEffect(() => {
    if (!videoRef.current) return;

    const updateInterval = 5000; // Update every 5 seconds
    let startTime = null;
    
    const handleTimeUpdate = () => {
      const currentTime = Math.floor(videoRef.current.currentTime);
      const now = Date.now();

      // Only update if enough time has passed since last update
      if (now - lastUpdateRef.current < updateInterval) return;

      if (startTime === null) {
        startTime = currentTime;
      } else {
        // Create an interval from start to current time
        const interval = {
          start: startTime,
          end: currentTime
        };

        // Update progress on server
        updateProgress(interval);
        startTime = null;
      }

      lastUpdateRef.current = now;
    };

    const handlePause = () => {
      if (startTime !== null) {
        const interval = {
          start: startTime,
          end: Math.floor(videoRef.current.currentTime)
        };
        updateProgress(interval);
        startTime = null;
      }
    };

    const handleSeeked = () => {
      startTime = Math.floor(videoRef.current.currentTime);
    };

    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    videoRef.current.addEventListener('pause', handlePause);
    videoRef.current.addEventListener('seeked', handleSeeked);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        videoRef.current.removeEventListener('pause', handlePause);
        videoRef.current.removeEventListener('seeked', handleSeeked);
      }
    };
  }, [videoId]);

  const updateProgress = async (interval) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/progress`, {
        userId,
        start: interval.start,
        end: interval.end,
        lastPosition: Math.floor(videoRef.current.currentTime)
      });

      if (response.data.success) {
        setProgress(response.data.progress.progressPercentage);
        setWatchedIntervals(response.data.progress.watchedIntervals);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error || 'Video not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full rounded-lg shadow-lg"
            controls
            src={`${API_BASE_URL}/videos/stream/${videoId}`}
            onError={(e) => {
              console.error('Video loading error:', e);
              setError('Failed to load video. Please try again.');
            }}
          />
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Progress: {Math.round(progress)}%
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{video.description}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 