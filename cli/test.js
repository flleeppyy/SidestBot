#!/usr/local/bin/node
const axios = require("axios");
const { readFileSync } = require("fs");
const path = require("path");
async function fuck() {
  const tagsFile = readFileSync(path.join(__dirname, "tags.json"), "utf8");
  const tags = JSON.parse(tagsFile);
  const queryOptions = {
    page: "dapi",
    s: "post",
    q: "index",
    json: 1,
    limit: 10,
    api_key: "3a7a5c9f83b07f92112c740993bb30ea3844d352494f8302e0f235686c64c23d",
    user_id: "568915",
  }

  const queryOptionsString = Object.keys(queryOptions).map(key => `${key}=${queryOptions[key]}`).join("&");
  const querytagsarray = tags.map(tag => encodeURIComponent(tag));
  const queryTags = querytagsarray.join("+");
  
  const url = `https://gelbooru.com/index.php?${queryOptionsString}&pid=1&tags=${queryTags}`
  // const request = await axios.get(url);
  
  console.log(url)
  
}

fuck();