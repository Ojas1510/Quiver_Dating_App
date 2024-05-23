import { useCookies } from "react-cookie";

const ChatHeader = ({ user }) => {
  const [cookies, setCookie, removeCookie] = useCookies(["user"]);

  const logout = () => {
    removeCookie("UserId", cookies.UserId);
    removeCookie("AuthToken", cookies.AuthToken);
    window.location.reload();
  };

  return (
    <div className="chat-container-header">
      <div className="profile">
        <div className="img-container">
          <img src={user.url} alt={"Picture of" + user.first_name} />
        </div>
        <h1>
          <b> ‎ {user.first_name} </b>
        </h1>
      </div>
      <i className="log-out-icon " onClick={logout}>
        <h1>↪ </h1>{" "}
      </i>
    </div>
  );
};
export default ChatHeader;
