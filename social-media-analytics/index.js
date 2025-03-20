require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 9876;
const TEST_SERVER_URL = process.env.TEST_SERVER_URL;

let userPostCounts = new Map();

app.get("/users", async (req, res) => {
    try {
        const userResponse = await axios.get(`${TEST_SERVER_URL}/users`);
        const users = userResponse.data.users;

        let userPostData = [];

        await Promise.all(Object.keys(users).map(async (userId) => {
            if (!userPostCounts.has(userId)) {
                const postResponse = await axios.get(`${TEST_SERVER_URL}/users/${userId}/posts`);
                userPostCounts.set(userId, postResponse.data.posts.length);
            }
            userPostData.push({ id: userId, name: users[userId], posts: userPostCounts.get(userId) });
        }));

        // Sort and return top 5 users
        userPostData.sort((a, b) => b.posts - a.posts);
        res.json({ top_users: userPostData.slice(0, 5) });

    } catch (error) {
        console.error("Error fetching top users:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/posts", async (req, res) => {
    const type = req.query.type;

    if (!["popular", "latest"].includes(type)) {
        return res.status(400).json({ error: "Invalid type. Use 'popular' or 'latest'." });
    }

    try {
        const userResponse = await axios.get(`${TEST_SERVER_URL}/users`);
        const users = userResponse.data.users;

        let allPosts = [];

        await Promise.all(Object.keys(users).map(async (userId) => {
            const postResponse = await axios.get(`${TEST_SERVER_URL}/users/${userId}/posts`);
            allPosts.push(...postResponse.data.posts);
        }));

        if (type === "popular") {
            let postCommentCounts = new Map();

            await Promise.all(allPosts.map(async (post) => {
                const commentResponse = await axios.get(`${TEST_SERVER_URL}/posts/${post.id}/comments`);
                postCommentCounts.set(post.id, commentResponse.data.comments.length);
            }));

            let maxComments = Math.max(...postCommentCounts.values());
            let mostPopularPosts = allPosts.filter(post => postCommentCounts.get(post.id) === maxComments);

            return res.json({ top_posts: mostPopularPosts });

        } else if (type === "latest") {
            allPosts.sort((a, b) => b.id - a.id);
            return res.json({ latest_posts: allPosts.slice(0, 5) });
        }

    } catch (error) {
        console.error("Error fetching posts:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
