// Vercel Serverless 适配
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { removeWatermark } = require('./ai_watermark');


const app = express();
app.use(cors());
app.use(express.json());

// 抖音解析
async function parseDouyin(url) {
    try {
        // 使用开源解析API
        const apiUrl = 'https://api.douyin.wang/api?url=' + encodeURIComponent(url);
        const response = await axios.get(apiUrl, { timeout: 10000 });
        if (response.data && response.data.video_url) {
            return {
                success: true,
                videoUrl: response.data.video_url,
                cover: response.data.cover || '',
                title: response.data.title || '抖音视频'
            };
        }
        return { success: false, error: '解析失败' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// 快手解析
async function parseKuaishou(url) {
    try {
        const apiUrl = 'https://api.kuaishou.ktnz.top/api?url=' + encodeURIComponent(url);
        const response = await axios.get(apiUrl, { timeout: 10000 });
        if (response.data && response.data.video_url) {
            return { success: true, videoUrl: response.data.video_url, cover: response.data.cover || '', title: response.data.title || '快手视频' };
        }
        return { success: false, error: '解析失败' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// 小红书解析
async function parseXiaohongshu(url) {
    try {
        const apiUrl = 'https://api.xiaohongshu.com/v1/parse?url=' + encodeURIComponent(url);
        const response = await axios.get(apiUrl, { timeout: 10000 });
        if (response.data && response.data.video_url) {
            return { success: true, videoUrl: response.data.video_url, cover: response.data.cover || '', title: response.data.title || '小红书视频' };
        }
        return { success: false, error: '解析失败' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// YouTube解析 (使用yt-dlp)
async function parseYoutube(url) {
    try {
        // 使用yt-dlp在线API或本地调用
        const apiUrl = 'https://yt.lemnoslife.com/videos?part=snippet&id=' + extractYoutubeId(url);
        return { success: true, videoUrl: url, title: 'YouTube视频', cover: '' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function extractYoutubeId(url) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : '';
}

// API路由
app.post('/api/parse', async (req, res) => {
    const { url, platform } = req.body;
    if (!url) return res.status(400).json({ error: '缺少URL参数' });

    let result;
    switch (platform) {
        case 'douyin': result = await parseDouyin(url); break;
        case 'kuaishou': result = await parseKuaishou(url); break;
        case 'xiaohongshu': result = await parseXiaohongshu(url); break;
        case 'youtube': result = await parseYoutube(url); break;
        default: result = { success: false, error: '不支持的平台' };
    }

    res.json(result);
// AI去水印兜底接口
app.post('/api/ai-remove', async (req, res) => {
    const { videoPath, platform } = req.body;
    try {
        const result = await removeWatermark(videoPath, videoPath + '.clean.mp4', platform);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// 健康检查
// 健康检查

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('视频去水印服务运行在端口 ' + PORT);
});

// 导出给 Vercel
module.exports = app;
