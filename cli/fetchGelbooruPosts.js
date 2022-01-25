#!/usr/local/bin/node
const fs = require("fs");
const path = require("path");
const prompt = require("prompt");
const pino = require("pino");
const colors = require("colors");

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const args = yargs(hideBin(process.argv)).argv

if (!fs.existsSync(path.join(__dirname, "tags.json"))) {
  console.error("tags.json not found. Please copy tags.json.example to tags.json and edit it.");
  process.exit(2);
}

const tags = require("./tags.json");

if (tags.length === 0) {
  console.error("No tags found. Please add tags to tags.json in such format:\n" + JSON.stringify(["tag1", "tag2"], null, 2));
  process.exit(13);
}

const options = {
  configParams: {
    includeTags: false,
    includeOriginalSource: false,
  },
  userParameters: {
    apiKey: null,
    userId: null
  },
  proxy: null
}

// if there are any options besides "$0" and _ , then do cli mode
if (Object.keys(args).length > 2) {
  if (!args.apiKey) {
    console.error("Please provide apiKey");
    process.exit(1);
  }
  
  if (!args.userId) {
    console.error("Please provide userId");
    process.exit(1);
  }
  
  if (args.includeTags) {
    options.configParams.includeTags = true;
  }
  
  if (args.includeOriginalSource) {
    options.configParams.includeOriginalSource = true;
  }
  
  options.userParameters.apiKey = args.apiKey;
  
  options.userParameters.userId = args.userId;
  
  if (args.proxy) {
    options.proxy = args.proxy;
  }

  start();
}

const {default: axios_} = require("axios");
let axios;
if (options.proxy) {
  const socks = require("socks-proxy-agent");
  const ipRegex = /^(?:https?:\/\/)?(?:(([a-zA-Z0-9]*):((?=[a-zA-Z]+)(?=.*\d)(?=.*[!#$%&? "]?).*))@)?((?:\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3})(?::(\d{1,5}))?\/?.*$/;
  
  if (!ipRegex.test(proxy)) {
    console.error("Proxy is not valid");
    process.exit(1);
  }
  
  const proxyParts = ipRegex.exec(options.proxy).splice(1);

  let proxyHasUserAndPassword = false;
  if (proxy.includes("@")) {
    proxyHasUserAndPassword = true;
  }

  if (proxyHasUserAndPassword) {
    this.proxyPassword = 
  

  const proxyUrl = proxy.replace(/^https?:\/\//, "");
  const proxyHost = proxyUrl.split(":")[0];
  const proxyPort = proxyUrl.split(":")[1];
  let [httpAgent,httpsAgent] = new socks.SocksProxyAgent({
    "ipaddress": proxyHost,
    "port": proxyPort,
    "username": proxyHasUserAndPassword ? proxy.split(":")[1].split("@")[0] : null,
    "password": proxyHasUserAndPassword ? proxy.split(":")[1].split("@")[1] : null
  });
  
  global.axios = axios_({
    httpAgent,
    httpsAgent,
  });

// prompt.start({message: "​"});

async function getProperties() {
  console.log("Please enter the following items from gelbooru");
  if (!options.userParameters.userId) {
    let result = await prompt.get({
      name: "userId",
      description: "User ID".white
    });

    options.userParameters.userId = result.userId;
  }
  
  if (!options.userParameters.apiKey) {
    let result = await prompt.get({
      name: "apiKey",
      description: "API Key".white
    });
    options.userParameters.apiKey = result.apiKey;
  }
  
  // y/n prompt for whether to use the default tags.json or not.
  console.log("Please answer the following questions with Y/n");
  if (!options.configParams.includeTags) {
    let result = await prompt.get({
      name: "includeTags",
      description: "Include tags?".white
    });
    if (result.includeTags === "Y" || result.includeTags === "y") {
      options.configParams.includeTags = true;
    }
  }

  if (!options.configParams.includeOriginalSource) {
    let result = await prompt.get({
      name: "includeOriginalSource",
      description: "Include original source?".white
    });
    if (result.includeOriginalSource === "Y" || result.includeOriginalSource === "y") {
      options.configParams.includeOriginalSource = true;
    }
  }  
}

async function start() {
  // Warn the user that it will clear their posts and start over
  if (!args.y) { 
    const clearingConfirmation = await prompt.get([{
      "name": "confirm",
      "description": "This will clear your posts.json and start over. Are you sure you want to continue? (yes/no)".white,
    }]);
    if (clearingConfirmation.confirm !== "yes") {
      console.info("Aborting.");
      process.exit(0);
    }
  }

  if (!Object.keys(args).length > 2) {
    await getProperties();
  }

  const queryTagsArray = tags.map(tag => encodeURIComponent(tag));
  const queryTags = queryTagsArray.join("+");

  const queryOptions = {
    page: "dapi",
    s: "post",
    q: "index",
    json: 1,
    limit: 1000,
    api_key: options.userParameters.apiKey,
    user_id: options.userParameters.userId,
  }
  
  // format query options
  const queryOptionsString = Object.keys(queryOptions).map(key => `${key}=${queryOptions[key]}`).join("&");
  
  const gbPosts = [];
  let postNum = 0;
  
  for (let pageId = 0; pageId <= 20; pageId++) {
    process.stdout.write(`\rCurrent Page: ${pageId + 1}; Total of ${postNum} posts fetched.`);
    const url = `https://gelbooru.com/index.php?${queryOptionsString}&pid=${pageId}&tags=${queryTags}`
    const request = await axios.get(url);

    // console.log(request.data);
    const response = request.data;
    const attributes = response["@attributes"];
    
    if (!response.post) {
      break;
    }
    for (let i = 0; i < response.post.length; i++) {
      process.stdout.write(`\rCurrent Page: ${pageId}; Total of ${postNum++}/${attributes.count} posts fetched.`);
      
      gbPosts.push(response.post[i]);
    }
  }
  
  let posts = [];
  // process all posts
  gbPosts.forEach((post,postIndex) => {
    process.stdout.write(`\rCTotal of ${postNum++} posts fetched - Processing post ${postIndex}/${gbPosts.length}`);
    try {
      posts.push({
        id: post.id,
        url: "https://gelbooru.com/index.php?page=post&s=view&id=" + post.id,
        file_url: post.file_url,
        tags: configParams["includeTags"] ? post.tags : undefined,
        source: configParams["includeOriginalSource"] ? post.source : undefined,
      });
      PostNum += posts.length;
    } catch (error) {
      console.error(error)
    }
  });
  
  
  if (posts.length === 0) {
    console.info("No posts found. Try different tags");
    process.exit(1);
  }
  
  // if theres a small amount of posts, prompt the user to confirm
  if (posts.length < 100) {
    const overwriteConfirmation = await prompt.get([
      {
        name: "confirm",
        description: "There are less than 100 posts. Are you sure you want to overwrite posts.json? (Y/n)".white
      }
    ]);
    if (overwriteConfirmation.confirm !== "yes") {
      console.info("Aborting.");
      process.exit(1223);
    }
  }
  
  try {
    fs.writeFileSync(path.join(__dirname, "../src/posts.json"), JSON.stringify({posts, completedPosts: []}));
    console.info("Finished fetching posts and saved to parent directory in src/posts.json");
  } catch (error) {
    console.error("Failed to save", error);
    return 1;
  }
  
  process.on("uncaughtException", (error) => {
    console.error(error);
    process.exit(1);
  });
  
  process.on("unhandledRejection", (error) => {
    console.error(error);
    process.exit(1);
  });
}

start();