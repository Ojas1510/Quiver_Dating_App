import TinderCard from "react-tinder-card";
import { useCallback, useEffect, useState } from "react";
import ChatContainer from "../components/ChatContainer";
import axios from "axios";
import { useCookies } from "react-cookie";
import API_URL from "../api";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [genderedUsers, setGenderedUsers] = useState(null);
  const [cookies] = useCookies(["user"]);
  const [lastDirection, setLastDirection] = useState();
  const userId = cookies.UserId;

  const getUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/user`, { params: { userId } });
      setUser(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [userId]);

  const getGenderedUsers = useCallback(async () => {
    if (!user?.gender_interest) return;
    try {
      const response = await axios.get(`${API_URL}/gendered-users`, {
        params: { gender: user.gender_interest },
      });
      setGenderedUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [user?.gender_interest]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  useEffect(() => {
    getGenderedUsers();
  }, [getGenderedUsers]);

  const updateMatches = async (matchedUserId) => {
    try {
      await axios.put(`${API_URL}/addmatch`, { userId, matchedUserId });
      getUser();
    } catch (err) {
      console.log(err);
    }
  };

  const swiped = (direction, swipedUserID) => {
    if (direction === "right") updateMatches(swipedUserID);
    setLastDirection(direction);
  };

  const outOfFrame = (name) => console.log(name + " left the screen!");

  const matchedUserIds = (user?.matches || []).map(({ user_id }) => user_id).concat(userId);
  const filteredGenderedUsers = genderedUsers?.filter(
    (genderedUser) => !matchedUserIds.includes(genderedUser.user_id)
  );

  return (
    <>
      {user && (
        <div className="dashboard">
          <ChatContainer user={user} />
          <div className="swipe-container">
            <div className="card-container">
              {filteredGenderedUsers?.map((genderedUser) => (
                <TinderCard
                  className="swipe"
                  key={genderedUser.user_id}
                  onSwipe={(dir) => swiped(dir, genderedUser.user_id)}
                  onCardLeftScreen={() => outOfFrame(genderedUser.first_name)}
                >
                  <div style={{ backgroundImage: "url(" + genderedUser.url + ")" }} className="card">
                    <h3>{genderedUser.first_name}</h3>
                  </div>
                </TinderCard>
              ))}
              <div className="swipe-info">
                {lastDirection ? <p>You swiped {lastDirection}</p> : <p />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
