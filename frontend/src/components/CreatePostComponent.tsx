import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../../config.json";
import { useParams } from "react-router-dom";
import "../pages/ListPopup.css";

function CreatePostComponent({
  updatePosts,
  show,
  handleClose,
}: {
  updatePosts: () => void;
  show: boolean;
  handleClose: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // State for the image URL
  const [hashtags, setHashtags] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  function CreatePostComponent({ updatePosts }: { updatePosts: () => void }) {
    const [caption, setCaption] = useState('');
    const [imageUrl, setImageUrl] = useState('');  // State for the image URL
    const [hashtags, setHashtags] = useState('');  // State for hashtags
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const { username } = useParams();
    // const fileInputRef = useRef<HTMLInputElement>(null); // Ref to handle file input

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData();
      if (uploadedImage) {
        formData.append("image", uploadedImage);
        // console.log("Selected filea:", uploadedImage);
        if (uploadedImage) {
          formData.append('image', uploadedImage);
        }
        formData.append('caption', caption);
        formData.append('hashtags', hashtags);
        // console.log(formData);

        try {
          // console.log("herea");
          // for (let pair of formData.entries()) {
          //   console.log(pair[0]+ ', ' + pair[1]); 
          // }
          const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
          });
          console.log(response);
          if (response.status === 201 || response.status === 200) {
            setCaption('');
            setImageUrl('');  // Clear the image URL input
            setHashtags('');  // Clear the hashtags input
            setUploadedImage(null);
            // Update posts
            updatePosts();
          }
        } catch (error) {
          console.error("Error creating post:", error);
        }

        handleClose();
      };

      const showHideClassName = show ? "popup display-block" : "popup display-none";

      return (
        <div className='w-screen h-screen flex justify-center'>
          <form>
            <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
              <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                Create Post
              </div>
              <div className='flex space-x-4 items-center justify-between'>
                <label htmlFor="caption" className='font-semibold'>Caption</label>
                <textarea
                  id="caption"
                  placeholder="Caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="border border-gray-300 p-2 rounded-md mb-2"
                  rows={4}
                  required
                ></textarea>
              </div>
              <div className="flex flex-col items-center justify-center">
                <label htmlFor="uploadedImage" className="font-semibold mb-2">
                  Upload Profile Picture (required)
                </label>
                <input
                  id="uploadedImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadedImage(e.target.files[0])}

                // onChange={handleImageUpload}
                />
              </div>
              <div className='flex space-x-4 items-center justify-between'>
                <label htmlFor="imageUrl" className='font-semibold'>Image URL</label>
                <input id="imageUrl" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
                  value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              <div className='flex space-x-4 items-center justify-between'>
                <label htmlFor="hashtags" className='font-semibold'>Hashtags</label>
                <input id="hashtags" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
                  value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
              </div>
              <div className='w-full flex justify-center'>
                <button type="submit" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                  onClick={handleSubmit}>Create Post</button>
              </div>
            </div>
          </form>
        </div>
      );
    }

    export default CreatePostComponent;

//   return (
//     <div className='w-screen h-screen flex justify-center'>
//       <form>
//         <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
//           <div className='font-bold flex w-full justify-center text-2xl mb-4'>
//             Create Post
//           </div>
//           <div className='flex space-x-4 items-center justify-between'>
//             <label htmlFor="title" className='font-semibold'>Title</label>
//             <input id="title" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
//               value={title} onChange={(e) => setTitle(e.target.value)} />
//           </div>
//           <div className='flex space-x-4 items-center justify-between'>
//             <label htmlFor="content" className='font-semibold'>Content</label>
//             {/* <input id="content" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
//             value={content} onChange={(e) => setContent(e.target.value)} /> */}
//             <textarea
//               placeholder="Content"
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               className="border border-gray-300 p-2 rounded-md mb-2"
//               rows={4}
//               required
//             ></textarea>
//           </div>

//           <div className='w-full flex justify-center'>
//             <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
//               onClick={handleSubmit}>Create Post</button>
//           </div>
//         </div>
//       </form>
//     </div>

//   );
// }

// export default CreatePostComponent;
