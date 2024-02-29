const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cheerio = require("cheerio");

const instagramCrawl = async (username) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: await chromium.executablePath(),
    args: ["--no-sandbox"],
  });
  var page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );
  await page.evaluate("navigator.userAgent");
  var request = await page.goto(
    `https://www.instagram.com/${username}/p/C345sfkpgMm/`
  );

  if (request.status == 404) {
    browser.close();
    console.log("This account is not exist");
    return "This account is not exist";
  } else if (request.status == 429) {
    browser.close();
    console.log("Too many requests");
    return "Too many requests";
  } else {
    var page_content = await page.content();
    var $ = await cheerio.load(page_content);
    var content = $("body script").html();
    browser.close();
    getData = /window._sharedData = (.*);/g;
    data = JSON.parse(getData.exec(content)[1]);
    profile = JSON.parse(
      JSON.stringify(data.entry_data["ProfilePage"][0]["graphql"]["user"])
    );
    mediaCount = profile.edge_owner_to_timeline_media["count"];

    media = profile.edge_owner_to_timeline_media.edges.map((x) => ({
      shortcode: x.node["shortcode"],
      display_url: x.node["display_url"],
      numberLikes: x.node.edge_liked_by["count"],
      numberComments: x.node.edge_media_to_comment["count"],
      mentions: x.node.edge_media_to_tagged_user.edges.map(
        (y) => y.node.user["username"]
      ),
      location: x.node["location"],
      caption: x.node.edge_media_to_caption.edges.map((z) => z.node["text"]),
    }));

    var userInfo = {
      username: profile["username"],
      full_name: profile["full_name"],
      profile_picture: profile["profile_pic_url"],
      profile_picture_hd: profile["profile_pic_url_hd"],
      is_private: profile["is_private"],
      id: profile["id"],
      bio: profile.biography,
      media: profile.edge_owner_to_timeline_media["count"],
      followed_by: profile.edge_followed_by["count"],
      follows: profile.edge_follow["count"],
      website: profile.external_url,
      images: media,
    };
    return userInfo;
  }
};
exports.handler = async (event) => {
  console.log("lambda invoked");
  console.log(await instagramCrawl("timesapgu"));
  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
  return response;
};
