const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 2020;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

async function getRepos(req, res, next) {
    try {
        console.log("Fetching data...");
        const { username }  = req.params;

        const response = await fetch(`http://api.github.com/users/${username}`);

        const data = await response.json();
        const repos = data.public_repos;

        // add into redis
        client.setex(username, 7200, repos);
        res.send(`${username} has repos: ${repos}`);
    } catch(error) {
        console.log("Error:" + error);
        res.status(500);
    }
}

//middleware
function cache (req, res, next) {
    const {username} = req.params;

    client.get(username, (err, data)=> {
        if(err) throw err;

        if(data !== null) {
            res.send(`${username} has repos: ${data}`);
        } else {
            next();
        }
    });
}

app.get('/repos/:username',cache, getRepos);

app.listen(2020, function () {
    console.log(`Listening on port ${PORT}`);
});