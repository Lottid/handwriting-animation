/*
 * @Author: uncoder 
 * @Date: 2018-02-05 17:48:19 
 * @Last Modified by: uncoder
 * @Last Modified time: 2018-02-26 15:36:35
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
	// 格式化数据
	let arry = [];
	for (let i = 1; i < data.length; i += 1) {
		const front = data[i - 1].split(' ');
		const end = data[i].split(' ');
		const points = [parseInt(front[0]), parseInt(front[1]), parseInt(end[0]), parseInt(end[1])];
		arry.push(points);
	}
	let oldTime = Date.now();
	let rafid = window.requestAnimationFrame(step);
	function step() {
		const newTime = Date.now();
		if (newTime - oldTime > tick) {
			oldTime = newTime;
			if (arry.length == 0) {
				window.cancelAnimationFrame(rafid);
				// canvasCache = cloneCanvas(ctx);
				canvasCache = ctx.getImageData(0, 0, canvasWidth, canvasHeigth);
				resolve('next');
			} else {
				const point = arry.shift();
				ctx.beginPath();
				ctx.moveTo(point[0] * scale, point[1] * scale);
				ctx.lineTo(point[2] * scale, point[3] * scale);
				ctx.closePath();
				ctx.stroke();
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
