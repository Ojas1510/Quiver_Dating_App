import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import API_URL from "../api";

const MatchesDisplay = ({ matches, setClickedUser }) => {
  const [matchedProfiles, setMatchedProfiles] = useState(null);
  const [cookies] = useCookies(["user"]);
  const matchedUserIds = useMemo(
    () => matches.map(({ user_id }) => user_id),
    [matches]
  );
  const userId = cookies.UserId;

  const getMatches = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        params: { userIds: JSON.stringify(matchedUserIds) },
      });
      setMatchedProfiles(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [matchedUserIds]);

  useEffect(() => {
    getMatches();
  }, [getMatches]);

  const filteredMatchedProfiles = matchedProfiles?.filter(
    (matchedProfile) =>
      matchedProfile.matches.filter((profile) => profile.user_id === userId).length > 0
  );

  return (
    <div className="matches-display">
      {filteredMatchedProfiles?.map((match, index) => (
        <div key={index} className="match-card" onClick={() => setClickedUser(match)}>
          <div className="img-container">
            <img src={match?.url} alt={match?.first_name + " profile"} />
          </div>
          <h3>{match?.first_name}</h3>
        </div>
      ))}
    </div>
  );
};

export default MatchesDisplay;
