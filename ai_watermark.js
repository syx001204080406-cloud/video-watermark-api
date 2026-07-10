// AI去水印兜底方案
// 使用开源图像修复技术去除水印
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 检测视频中的水印区域（基于常见位置）
function detectWatermarkRegion(platform, videoWidth, videoHeight) {
    const regions = {
        douyin: { x: videoWidth * 0.7, y: videoHeight * 0.85, width: videoWidth * 0.25, height: videoHeight * 0.1 },
        kuaishou: { x: videoWidth * 0.75, y: videoHeight * 0.88, width: videoWidth * 0.2, height: videoHeight * 0.08 },
        xiaohongshu: { x: videoWidth * 0.8, y: videoHeight * 0.9, width: videoWidth * 0.15, height: videoHeight * 0.07 },
        youtube: null // YouTube通常无水印
    };
    return regions[platform] || null;
}

// 使用FFmpeg去除水印（通过模糊/覆盖）
async function removeWatermark(inputPath, outputPath, platform) {
    return new Promise((resolve, reject) => {
        // 获取视频信息
        exec('ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ' + inputPath, (err, stdout) => {
            if (err) {
                reject(new Error('无法获取视频信息: ' + err.message));
                return;
            }
            const [width, height] = stdout.trim().split('x').map(Number);
            const region = detectWatermarkRegion(platform, width, height);
            if (!region) {
                resolve({ success: false, error: '该平台无需去水印' });
                return;
            }
            const { x, y, w, h } = region;
            const ffmpegCmd = 'ffmpeg -i ' + inputPath + ' -vf delogo=x=' + x + ':y=' + y + ':w=' + w + ':h=' + h + ' -c:a copy ' + outputPath;
            exec(ffmpegCmd, (err) => {
                if (err) {
                    reject(new Error('去水印失败: ' + err.message));
                } else {
                    resolve({ success: true, outputPath });
                }
            });
        });
    });
}

module.exports = { removeWatermark, detectWatermarkRegion };
