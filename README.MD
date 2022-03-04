<div align="center">

# SidestBot

</div>

SidestBot is an image bot that allows you to create different image bot instances, that post images to different social media platforms.

## How it works

The `instances` folder contains the image bot instances. Each instance has a `config.json` file that contains the configuration for that instance. This folder also contains a `posts.json` file, which holds all the posts, completed and uncompleted, that were and will be posted to the drivers.

As said before, drivers are used to post to multiple platforms such as Twitter or Mastodon. You can make a PR to add more drivers

## Configurations

### Root config

In the root folder, you'll find [config.example.js](config.example.js). Copy it to `config.js` and change the values to your needs.

This configuration file contains some options for disabling instances and drivers, as well as enabling error reporting.

You can configure error reporting to send a messsage to Discord or Telegram

### Instance config

An "instance" contains a configuration file. This configuration file contains authentication data for drivers/social platforms, as well as said drivers to be togged on or off via a boolean.

- `options` contains basic information about the bot, as well as the status/caption text for each post.
- `enabled` has "switches" that enable or disable drivers.

After these, you'll see configurations for drivers. You'll likely be entering authentication data for the drivers.

## CLI Commands

### Fetching posts for instances

To fetch posts, you'll be using `cli/posts fetch`, which is a CLI command for fetching posts from different boorus. You can see if your image board is supported by running `cli/posts boorus`.

⚠️ If you get a permission denied when executing the cli, run `chmod +x cli/posts`.

Here's a few examples:

- Fetching posts from Gelbooru with the tags "chen rating:safe", and a limit of 10 posts, and saving to the `chen` instance
- - `cli/posts fetch --booru gelbooru.com --tags "chen rating:safe" --limit 10 --instance chen`
- Fetching posts from Safebooru with the tags "reiuji_utsuho kaenbyou_rin rating:safe"
- - `cli/posts fetch --booru safebooru.org --tags "reiuji_utsuho kaenbyou_rin rating:safe"`

Some available options for `fetch` are:
`--booru` - The booru to fetch posts from
`--includeTags` - Includes the tags of every post (Not recommended as it will add to file size)
`--includeSources` - Includes the sources of every post (e.g Links to pixiv, a Twitter post)
`--limit` - The maximum number of posts to fetch
`--tags` - The tags to search for
`--instance` - The instance to save the posts to. If no instance is specified, the posts will be saved to the root of the repo.

You can place a `tags.json` file in the cli folder, or instance to store your tags. Any tags specified in the command will override using `tags.json`.
Heres an example:

```json
[
  "chen",
  "touhou_project",
  "rating:safe",
]
```

### Resetting posts for instances

To reset posts, you'll be using `cli/posts reset`. This will move all completedPosts, back to the posts array.

For example, if you have the following posts.json file:

```json
{
  "posts": [
    {
      "id": "123456",
      ...
    }
  ],
  completedPosts: [
    {
      "id": "123455",
      "failed": true
      ...
    }
  ],
  ...
}
```

It would turn into:

```json
{
  "posts": [
    {
      "id": "123456",
      ...
    },
    {
      "id": "123455",
      ...
    }
  ],
  completedPosts: [],
  ...
}
```

- To reset an instance
- - `cli/posts reset --instance instanceName`
- To reset all instances
- - `cli/posts reset --instance all`

## License

This project is licensed under the GPLv3 license.

Please read the additional clause in the [LICENSE](LICENSE) file under T&C 5.E
