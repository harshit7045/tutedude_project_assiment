import React, { useState, useEffect } from 'react';
import VideoProgressCard from '../components/VideoProgressCard';

const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'in-progress', 'completed'

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/videos/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load video progress');
        }

        const data = await response.json();
        setVideos(data);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load video progress');
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [API_BASE_URL]);

  const filteredVideos = videos.filter(video => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return video.progress > 0 && video.progress < 100;
    if (filter === 'completed') return video.progress === 100;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning Dashboard</h1>
        <p className="text-gray-600">
          Track your progress and continue learning where you left off
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Videos
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={`px-4 py-2 rounded-md ${
            filter === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <VideoProgressCard key={video._id} video={video} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">
              {filter === 'all'
                ? 'No videos found'
                : filter === 'in-progress'
                ? 'No videos in progress'
                : 'No completed videos'}
            </p>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Progress Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {videos.filter((v) => v.progress === 100).length}
            </p>
            <p className="text-gray-600">Completed Videos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {videos.filter((v) => v.progress > 0 && v.progress < 100).length}
            </p>
            <p className="text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(
                videos.reduce((acc, v) => acc + v.progress, 0) / videos.length
              ) || 0}
              %
            </p>
            <p className="text-gray-600">Average Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 