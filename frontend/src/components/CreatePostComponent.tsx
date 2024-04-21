import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

function CreatePostComponent({ updatePosts }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { username } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, {
        title,
        content,
      }, {withCredentials: true });
      console.log(response);
      if (response.status === 201 || response.status === 200) {
        // Clear input fields
        setTitle('');
        setContent('');
        // Update posts
        updatePosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className='w-screen h-screen flex justify-center'>
    <form>
      <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
        <div className='font-bold flex w-full justify-center text-2xl mb-4'>
          Create Post
        </div>
        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="title" className='font-semibold'>Title</label>
          <input id="title" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="content" className='font-semibold'>Content</label>
          {/* <input id="content" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
            value={content} onChange={(e) => setContent(e.target.value)} /> */}
            <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border border-gray-300 p-2 rounded-md mb-2"
          rows={4}
          required
        ></textarea>
        </div>
        
        <div className='w-full flex justify-center'>
          <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
            onClick={handleSubmit}>Create Post</button>
        </div>
      </div>
    </form>
  </div>

   


  );
}

export default CreatePostComponent;
