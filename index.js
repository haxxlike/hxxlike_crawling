const axios = require("axios");

const eventHandler = {
  running: async (event) => {
    const profile = await getProfileInstance.get("/", {
      params: {
        query_hash: "e769aa130647d2354c40ea6a439bfc08",
        variables: JSON.stringify({
          id: event.user_id,
          first: 1,
        }),
      },
    });
    console.log(JSON.stringify(profile.data.data));
  },
  fail: async (event) => {},
  first: async (event) => {
    const userId = await getUserIdInstance.get("/", {
      params: {
        username: event.username,
      },
    });
    event.user_id = userId;
    console.log(userId);
    return await eventHandler[event.state](event);
  },
};

const getUserIdInstance = axios.create({
  baseURL: `https://i.instagram.com/api/v1/users/web_profile_info`,
  headers: {
    "X-IG-App-ID": "936619743392459",
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36",
    Accept: "*/*",
  },
});

const getProfileInstance = axios.create({
  baseURL: `https://www.instagram.com/graphql/query`,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36",
    Accept: "*/*",
  },
});

const setState = (event, state) => {
  event.state = state;
};

const initialize = (event) => {
  getUserIdInstance.interceptors.response.use(
    (response) => {
      console.log(response.status);
      let state = "running";
      if (!response.data) state = "fail";
      setState(event, state);
      return state == "running" ? response.data.data.user.id : null;
    },
    (error) => {
      setState(event, "fail");
      return null;
    }
  );
};
exports.handler = async (event) => {
  console.log("lambda invoked");
  console.log(JSON.stringify(event));
  initialize(event);
  await eventHandler[event.state](event);
  console.log("current state", event.state);
  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
  return response;
};
