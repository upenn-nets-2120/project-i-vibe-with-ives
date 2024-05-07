// import React, { useState } from 'react';
// import axios from 'axios';
// import config from '../../config.json';
// import { useParams } from 'react-router-dom';

// function FriendRecsComponent() {
//   return (
//     <div className='w-screen h-screen flex justify-center'>
//       <form>
//         <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
//           <div className='font-bold flex w-full justify-center text-2xl mb-4'>
//             Create Post
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default FriendRecsComponent;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import config from '../../config.json';

function FriendRecsComponent() {
  const [recommendations, setRecommendations] = useState([]);
  const { username } = useParams(); // This retrieves the username from the URL


  useEffect(() => {
    const fetchData = async () => {
        try {
          const response = await axios.get(`${config.serverRootURL}/${username}/recommendations`)
          setRecommendations(response.data.results || []); // Assuming the data is the array of recommendations
        //   console.log(response.data.results);
          console.log("recommendations",recommendations);
        } catch (error) {
          console.error("Failed to fetch posts:", error);
        }
      };
    fetchData();
  }, [username]);

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center'>
      <h1 className='text-2xl font-bold mb-4'>Friend Recommendations for {username}</h1>
      <div className='bg-slate-50 p-6 rounded-md'>
        {recommendations.length > 0 ? (
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index} className='p-2'>
                {rec.username}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available.</p>
        )}
      </div>
    </div>
  );
}

export default FriendRecsComponent;
