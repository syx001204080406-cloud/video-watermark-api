const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// 抖音解析
async function parseDouyin(url) {
    try {
        const apiUrl = "https://api.douyin.wang/api?url=" + encodeURIComponent(url);
        const response = await axios.get(apiUrl, { timeout: 10000 });
        if (response.data && response.data.video_url) {
            return {
                success: true,
                videoUrl: response.data.video_url,
                cover: response.data.cover || "",
                title: response.data.title || "抖音视频"
            };
        }
        return { success: false, error: "解析失败" };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// 快手解析
async function parseKuaishou(url) {
    try {
        const apiUrl = "https://api.kuaishou.ktnz.top/api?url=" + encodeURIComponent(url);
        const response = await axios.get(apiUrl, { timeout: 10000 });
        if (response.data && response.data.video_url) {
            return { success: true, videoUrl: response.data.video_url, cover: response.data.cover || "", title: response.data.title || "快手视频" };
        }
        return { success: false, error: "解析失败" };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// 小红书解析
async function parseXiaohongshu(url) {
    try {
        return { success: false, error: "小红书解析暂未实现" };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// YouTube解析
async function parseYoutube(url) {
    try {
        return { success: true, videoUrl: url, title: "YouTube视频", cover: "" };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// API路由
app.post("/api/parse", async (req, res) => {
    const { url, platform } = req.body;
    if (!url) return res.status(400).json({ error: "缺少URL参数" });

    let result;
    switch (platform) {
        case "douyin": result = await parseDouyin(url); break;
        case "kuaishou": result = await parseKuaishou(url); break;
        case "xiaohongshu": result = await parseXiaohongshu(url); break;
        case "youtube": result = await parseYoutube(url); break;
        default: result = { success: false, error: "不支持的平台" };
    }

    res.json(result);
});

// 健康检查
app.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("视频去水印服务运行在端口 " + PORT);
});

module.exports = app;

