import Chat from "./Chat";
import ChatInput from "./ChatInput";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import API_URL from "../api";

const ChatDisplay = ({ user, clickedUser }) => {
  const userId = user?.user_id;
  const clickedUserId = clickedUser?.user_id;
  const [usersMessages, setUsersMessages] = useState(null);
  const [clickedUsersMessages, setClickedUsersMessages] = useState(null);

  const getUsersMessages = useCallback(async () => {
    if (!userId || !clickedUserId) return;
    try {
      const response = await axios.get(`${API_URL}/messages`, {
        params: { userId, correspondingUserId: clickedUserId },
      });
      setUsersMessages(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [userId, clickedUserId]);

  const getClickedUsersMessages = useCallback(async () => {
    if (!userId || !clickedUserId) return;
    try {
      const response = await axios.get(`${API_URL}/messages`, {
        params: { userId: clickedUserId, correspondingUserId: userId },
      });
      setClickedUsersMessages(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [userId, clickedUserId]);

  useEffect(() => {
    getUsersMessages();
    getClickedUsersMessages();
  }, [getUsersMessages, getClickedUsersMessages]);

  const messages = [];
  usersMessages?.forEach((message) => {
    messages.push({
      name: user?.first_name,
      img: user?.url,
      message: message.message,
      timestamp: message.timestamp,
    });
  });

  clickedUsersMessages?.forEach((message) => {
    messages.push({
      name: clickedUser?.first_name,
      img: clickedUser?.url,
      message: message.message,
      timestamp: message.timestamp,
    });
  });

  const descendingOrderMessages = messages.sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  return (
    <>
      <Chat descendingOrderMessages={descendingOrderMessages} />
      <ChatInput
        user={user}
        clickedUser={clickedUser}
        getUserMessages={getUsersMessages}
        getClickedUsersMessages={getClickedUsersMessages}
      />
    </>
  );
};

export default ChatDisplay;
