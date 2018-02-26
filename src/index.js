/*
 * @Author: uncoder 
 * @Date: 2018-02-05 17:48:19 
 * @Last Modified by: uncoder
 * @Last Modified time: 2018-02-26 17:32:28
 */
import './common/style/index.less';

require('core-js/library/fn/promise');
require('core-js/library/fn/symbol/async-iterator');

let ratio = window.devicePixelRatio;
let scale = 0.5 * ratio;

let canvasCache = null;
let canvasHeigth = null;
let canvasWidth = null;

async function init(data) {
	const size = getImgSize(data);
	canvasHeigth = size.height * scale;
	canvasWidth = size.width * scale;
	// canvas
	const myCanvas = document.createElement('canvas');
	myCanvas.setAttribute('height', canvasHeigth);
	myCanvas.setAttribute('width', canvasWidth);
	// 确保高清无码
	myCanvas.style.width = canvasWidth / ratio + 'px';
	document.body.appendChild(myCanvas);

	// ctx
	const ctx = myCanvas.getContext('2d');
	ctx.clearRect(0, 0, canvasWidth, canvasHeigth);
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 2 * scale;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	for (let i = 0; i < data.length; i++) {
		const line = data[i].points.split(',');
		let tick = line.length > 16 ? 16 : line.length;
		if (i > 0) {
			const duration = parseInt(data[i].timestamp - data[i - 1].timestamp);
			tick = (duration > 2000 ? 500 : duration) / line.length;
		}
		// 清空画布
		ctx.clearRect(0, 0, canvasWidth, canvasHeigth);

		// 静态的
		if (canvasCache) {
			// ctx.drawImage(canvasCache, 0, 0);
			ctx.putImageData(canvasCache, 0, 0);
		}

		await new Promise((resolve, reject) => {
			// 动态的
			_animateType(ctx, line, resolve, tick);
		});
	}
}
function getImgSize(data) {
	let maxHeight = 0;
	let maxWidth = 0;
	for (let i = 0; i < data.length; i++) {
		const points = data[i].points.split(',');
		for (let j = 0; j < points.length; j++) {
			const point = points[j].split(' ');
			const x = parseInt(point[0]);
			const y = parseInt(point[1]);
			if (x > maxWidth) {
				maxWidth = x;
			}
			if (y > maxHeight) {
				maxHeight = y;
			}
		}
	}
	return {
		width: maxWidth,
		height: maxHeight,
	};
}
function cloneCanvas(oldCanvas) {
	//create a new canvas
	var newCanvas = document.createElement('canvas');
	var context = newCanvas.getContext('2d');

	//set dimensions
	newCanvas.width = oldCanvas.width;
	newCanvas.height = oldCanvas.height;

	//apply the old canvas to the new one
	context.drawImage(oldCanvas, 0, 0);

	//return the new canvas
	return newCanvas;
}
function _animateType(ctx, data, resolve, tick) {
	// index
	let startIndex = 1;
	// 克隆数据
	let points = [];
	for (let i = 0; i < data.length; i += 1) {
		points.push(data[i]);
	}
	let oldTime = Date.now();
	let rafid = window.requestAnimationFrame(step);
	function step() {
		const newTime = Date.now();
		if (newTime - oldTime > tick * 2) {
			oldTime = newTime;
			if (startIndex >= points.length / 3) {
				// 这个地方有可能会丢点，懒一会再改
				window.cancelAnimationFrame(rafid);
				// canvasCache = cloneCanvas(ctx);
				canvasCache = ctx.getImageData(0, 0, canvasWidth, canvasHeigth);
				resolve('next');
			} else {
				//贝塞尔曲线
				const animatePoints = points.slice((startIndex - 1) * 3, startIndex * 3);
				if (animatePoints.length == 3) {
					ctx.beginPath();
					const startPoint = points[(startIndex - 1) * 3 == 0 ? 0 : (startIndex - 1) * 3 - 1].split(' ');
					ctx.moveTo(startPoint[0] * scale, startPoint[1] * scale);
					ctx.lineTo(animatePoints[0] * scale, animatePoints[1] * scale);
					const control1 = animatePoints[0].split(' ');
					const control2 = animatePoints[1].split(' ');
					const stop = animatePoints[2].split(' ');
					ctx.bezierCurveTo(
						control1[0] * scale,
						control1[1] * scale,
						control2[0] * scale,
						control2[1] * scale,
						stop[0] * scale,
						stop[1] * scale
					);
				} else {
					console.log('长度不够');
				}
				ctx.closePath();
				ctx.stroke();
				startIndex++;
				rafid = window.requestAnimationFrame(step);
			}
		} else {
			rafid = window.requestAnimationFrame(step);
		}
	}
}
window.onload = function() {
	d3.json('./debug.json', json => {
		const data = json.beautificated_pages[0].strokes;
		init(data);
	});
};
