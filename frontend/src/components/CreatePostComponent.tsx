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
  const { username } = useParams();
  // const fileInputRef = useRef<HTMLInputElement>(null); // Ref to handle file input

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (uploadedImage) {
      formData.append("image", uploadedImage);
    }
    formData.append("caption", caption);
    formData.append("hashtags", hashtags);

    console.log(formData);

    try {
      const response = await axios.post(
        `${config.serverRootURL}/${username}/createPost`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      console.log(response);
      if (response.status === 201 || response.status === 200) {
        setCaption("");
        setImageUrl(""); // Clear the image URL input
        setHashtags("");
        setUploadedImage(null);
        updatePosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }

    handleClose();
  };

  const showHideClassName = show ? "popup display-block" : "popup display-none";

  return (
    // <div className='w-screen h-screen flex justify-center'>
    //   <form onSubmit={handleSubmit} className='rounded-md bg-slate-50 p-6 space-y-4 w-1/2'>
    //     <h1 className='font-bold text-center text-2xl mb-4'>Create Post</h1>
    //     <div className='flex flex-col space-y-2'>
    //       <label htmlFor="caption" className='font-semibold'>Caption</label>
    //       <textarea
    //         id="caption"
    //         placeholder="Caption"
    //         value={caption}
    //         onChange={(e) => setCaption(e.target.value)}
    //         className="border border-gray-300 p-2 rounded-md"
    //         rows={4}
    //         required
    //       />
    //     </div>
    //     <div className='flex flex-col space-y-2'>
    //       <label htmlFor="uploadedImage" className='font-semibold'>Upload Image</label>
    //       <input
    //         ref={fileInputRef}
    //         id="uploadedImage"
    //         type="file"
    //         accept="image/*"
    //         required
    //       />
    //     </div>
    //     <div className='flex flex-col space-y-2'>
    //       <label htmlFor="hashtags" className='font-semibold'>Hashtags</label>
    //       <input
    //         id="hashtags"
    //         type="text"
    //         className='outline-none bg-white rounded-md border border-gray-300 p-2'
    //         value={hashtags}
    //         onChange={(e) => setHashtags(e.target.value)}
    //       />
    //     </div>
    //     <button type="submit" className='w-full mt-4 px-4 py-2 rounded-md bg-indigo-500 text-white font-bold'>Create Post</button>
    //   </form>
    // </div>

    <div className={showHideClassName}>
      <section className="popup-main">
        <form>
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="caption"
              className="font-semibold"
              onClick={handleClose}
            >
              Caption
            </label>
            <textarea
              id="caption"
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="border border-gray-300 p-2 rounded-md"
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="uploadedImage" className="font-semibold">
              Upload Image
            </label>
            <input
              id="uploadedImage"
              type="file"
              accept="image/*"
              onChange={(e) => setUploadedImage(e.target.files[0])}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label htmlFor="hashtags" className="font-semibold">
              Hashtags
            </label>
            <input
              id="hashtags"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
              onClick={handleSubmit}
            >
              Create Post
            </button>
          </div>
        </form>
      </section>
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