import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';

const Profile = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewedSegments, setViewedSegments] = useState([]);
  const [lastWatchTime, setLastWatchTime] = useState(0);
  const videoRef = useRef(null);
  const lastTimeRef = useRef(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          return;
        }

        const response = await axios.get('http://localhost:4002/api/videos/videos', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success && response.data.videos.length > 0) {
          setVideos(response.data.videos);
          setError(null);
        } else {
          setError('No videos available');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Error fetching videos');
      }
    };

    fetchVideos();
  }, []);

  // Fetch viewed segments and last watch time when a video is selected
  useEffect(() => {
    if (selectedVideo && token) {
      // Fetch viewed segments
      fetch(`${API_BASE_URL}/auth/getUserViewedSegments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: selectedVideo
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setViewedSegments(data.viewedSegments);
        } else {
          console.error('Failed to get viewed segments:', data.error);
        }
      })
      .catch(error => {
        console.error('Error getting viewed segments:', error);
      });

      // Fetch last watch time
      fetch(`${API_BASE_URL}/auth/getlastWatchedTime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: selectedVideo
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setLastWatchTime(data.lastWatchTime);
          // Set the video to the last watched position when it's loaded
          if (videoRef.current) {
            videoRef.current.currentTime = data.lastWatchTime;
          }
        } else {
          console.error('Failed to get last watch time:', data.error);
        }
      })
      .catch(error => {
        console.error('Error getting last watch time:', error);
      });
    }
  }, [selectedVideo, token]);

  // Set video position when it's loaded
  useEffect(() => {
    if (videoRef.current && lastWatchTime > 0) {
      videoRef.current.currentTime = lastWatchTime;
    }
  }, [lastWatchTime]);

  const handleVideoSelect = (videoId) => {
    setSelectedVideo(videoId);
    setIsPlaying(false);
    lastTimeRef.current = 0;
  };

  const getVideoUrl = (video) => {
    if (!video) return '';
    return `http://localhost:4002/api/videos/${video._id}/stream`;
  };

  const getThumbnailUrl = (video) => {
    if (!video?.thumbnail) return null;
    const cleanPath = video.thumbnail
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
    return `http://localhost:4002/${cleanPath}`;
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      lastTimeRef.current = videoRef.current.currentTime;
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSeeking = () => {
    setIsPlaying(false);
  };

  const handleSeeked = () => {
    if (videoRef.current) {
      lastTimeRef.current = videoRef.current.currentTime;
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const getCurrentVideoTime = () => {
    
    if (videoRef.current && isPlaying) {
      // Check if the current time is divisible by 5 seconds (segment boundary)
      const currentSegment = Math.floor(videoRef.current.currentTime / 5);
      
      if (videoRef.current.currentTime % 5 < 0.5) { // Within 0.5 seconds of segment boundary
        // Send the current segment to the backend
        fetch(`${API_BASE_URL}/auth/updateUserViewVideo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoId: selectedVideo,
            viewedSegments: [currentSegment]
          })      
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log(`Segment ${currentSegment} marked as watched`);
          } else {
            console.error('Failed to update video segment:', data.error);
          }
        })
        .catch(error => {
          console.error('Error updating video segment:', error);
        });
        
        // Get the current status of all viewed segments
        fetch(`${API_BASE_URL}/auth/getUserViewedSegments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoId: selectedVideo
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log(`Viewed segments: ${data.viewedSegments}`);
            setViewedSegments(data.viewedSegments);
          } else {
            console.error('Failed to get viewed segments:', data.error);
          }
        })
        .catch(error => {
          console.error('Error getting viewed segments:', error);
        });
      }
      
      console.log(`Current Time: ${videoRef.current.currentTime.toFixed(2)} seconds`);
    }
  };

  return (
    <div className="mt-20 px-4 py-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Videos Page</h1>
        
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div>
            {selectedVideo && (
              <div className="mb-8 bg-white rounded-lg shadow p-6">
                <video 
                  ref={videoRef}
                  controls 
                  className="w-full rounded-lg"
                  src={getVideoUrl(videos.find(v => v._id === selectedVideo))}
                  onTimeUpdate={getCurrentVideoTime}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeeking={handleSeeking}
                  onSeeked={handleSeeked}
                />
                
                {/* Video Progress Bar */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Video Progress</h3>
                  <div className="flex h-6 w-full overflow-hidden rounded-md border border-gray-300">
                    {viewedSegments.length > 0 ? (
                      viewedSegments.map((segment, index) => (
                        <div 
                          key={index}
                          className={`h-full ${segment === 1 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${100 / viewedSegments.length}%` }}
                          title={`Segment ${index}: ${segment === 1 ? 'Watched' : 'Not Watched'}`}
                        ></div>
                      ))
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No segments data available</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div 
                  key={video._id}
                  className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer transform transition-transform hover:scale-105 ${
                    selectedVideo === video._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleVideoSelect(video._id)}
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {getThumbnailUrl(video) ? (
                      <img 
                        src="https://th.bing.com/th/id/OIP.s5j5kFK-urpNTrVLlv9-ogHaEK?w=299&h=180&c=7&r=0&o=5&pid=1.7" 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg 
                          className="w-16 h-16 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {video.description}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm">
                      Duration: {Math.floor(video.duration / 60)}m {video.duration % 60}s
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 