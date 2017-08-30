/*
 * Loading模块
 * ------------
 * 控制loading的样式、状态、属性等
 * 1. loading初始只插入css
 * 2. 多tab时需主动插入html  如果没有  就插入再显示 有就直接显示
 */

function Loading(options) {

	this.opts = $.extend({}, {
		styleID: '__loading_style__',
		className: '__loading__',
		icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAD0UlEQVRoQ+1ZUVLbMBDV+kPwVzhBwwlKT1A4AXACkh8kf7U5AeEEhC9b/ISeAHOC0hM0PUHpCRo+YQZtZzNyRngkSzZOUjpoJjOZkb3at293tbsG9soXvHL92RuAdTP4xsB/xUCe5wcAsIuIPcYY/RYLAKaIeIeIN2ma3nUF/MUupJQ6RsQ9ADhkjG3FKEZAAKDQWl+8FExrAEqpQ0Q8B4Bnlo4BYD+DiFeIeNYWSGMAk8lk6/HxccIYI4s7FyL+BIAZbSLiFgB8CACbIeJISnnR1ACNAFxeXu5qra+rVjcKXwHA7cnJydSlRJZlvSRJiLW+DxCxIaUcNAERDYCUR8RvFT//rrUepWl62+TQLMsoZsYeIFPO+f5gMJgzGFpRADzKD4UQ49ABdftKqS+MsXPHM4UQ4ihGdhCA8Xmy/K4ReK+1PmxqdZ8yxEaSJAVj7F0luC+klASwdgUB5HlOVH8ulQeAPZ+fhw7z7RuGyQ2fgdBa74cMVQvABN4v6+AjIQRZq/OVZVk/SRLKbotF94WUcqfusFoAeZ4XAHBgBJwJIUada24JrLA939FaD9I0vfKd6wVQsf4957wXmxnagjTxRmXGwpVCLHgB2BkiZIW2CrveU0oRy6eVPa/regFY7nMvhIiqcboA4og7EvtVCNF3ya9jAM0L3pe7UNjDArnR+3Kvzo2cAExuptwfDKJlgFBKUdAe27I559uuGIwBEMzFXYNwxYHvTnACoFKZMXZNigkhgpfdEgC4SgxnIPsALDLBOgDYLmwZx3kP/ZMMmNLih81sIxeyLbAOBkjxShw0S6PmRvxDggDgY9fFW2zM0J2wubk5q6sA6u6BeS5e5S1cBUauFDJe3U08L6NpDCKl9Pa/sdZs8xy5cuty2gqkGed8Z9mFnMv6T09Ps9C0ojbHK6XKK33ppXQVAPUHdWV0+XyooSmbjJWyQK7DGLsLWX+eZEK+mef51EwPVsYClfKxA4MggEq/urSWsjQkdWUbGxuj2JgLAiDBVr86A4D9UGoLserbJ8trraehzGO/HwVgFSCUUqda698xgdsKQBWE1nrY9DCX5ctZq9aaxu7e5t3HWjQDpQB7EIWIt0mSDNu6lBnND5Mk6beV0RgAASGrPTw8jMqBFw1lGWOFlPIm5P+m5/2EiEP6RsA5H8cGrEt2KwAWGz0A+GI+blAPS2NySrs0oZ7/py81AEBDAfpRft9GxAIRxzF5PmSQFwGwhZt0u0efl+gzk71nQFEGK9q6SmcxELLIqvc7Y2DVikfVQutSqsm5bww0sdYynn31DPwFeAEST8nFLJYAAAAASUVORK5CYII=',
		size: 20,
		multi: 2.5,
		html: '<i></i><span>加载中, 请稍后...</span>'
	}, options);

	/**
	 * loading状态
	 * 0 可用状态
	 * 1 loading中
	 */
	this.status = 0;

	this.className = this.opts.className;

	//loading div自身高度 = 大小 * 倍数
	this.height = this.opts.size * this.opts.multi;

	/**
	 * 定义loading所在位置 默认在body中
	 * 多tab时，切换tab可让loading分别位于每个容器中
	 */
	this.container = $(document.body);
}

Loading.prototype = {
	constructor: Loading,
	init: function() {
		this.insertCSS();
	},
	insertCSS: function() {
		if(document.getElementById(this.opts.styleID)) return false;
		var style = document.createElement('style');
		style.id = this.opts.styleID;
		var str_css = [
			'.<className>{text-align:center;font-size:<size>px;color:#666;height:<multi>em;line-height:<multi>em;visibility:hidden;}',
			'.<className> i{display:inline-block;vertical-align:middle;margin-right:0.3em;background:url(<icon>) no-repeat;background-size:100%;width:0.9em;height:0.9em;animation: loader-infinite 1s infinite linear;-webkit-animation: loader-infinite 1s infinite linear;}',
			'.<className> span{display:inline-block;vertical-align:middle;font-size:0.7em;}',
			'.<className> input{border:1px solid #f2f2f2;width:62.5%;height:100%;padding:0;margin:0 auto;display:block;font-size:0.7em;}',
			'@keyframes loader-infinite {0% { transform: rotate(0deg);}	100% { transform: rotate(360deg);}}'
		].join('');
		style.innerHTML = this.replaceCss(this.opts, str_css);
		document.getElementsByTagName('head')[0].appendChild(style);
	},
	insert: function() {
		this.loading = null;
		if (!this.container.find('.' + this.className).length) {
			this.container.append('<div class="'+ this.className +'">'+ this.opts.html +'</span></div>');
		}
		this.loading = this.container.find('.' + this.className);
	},
	show: function() {
		this.insert();
		this.loading.html(this.opts.html).css('visibility', 'visible');
		this.status = 1;
	},
	hide: function() {
		this.loading.css('visibility', 'hidden');
		this.status = 0;
	},
	remove: function() {
		this.loading.remove();
		this.status = 0;
	},
	inform: function(str) {
		this.loading.html('<span>'+ str +'</span>');
		this.status = 0;
	},
	isLoading: function() {
		if (this.status == 1) {
			return true
		}
		return false;
	},
	/**
	 * 将str中带有尖括号的字符替换成对象中的value
	 * ----------------
	 * 参数：obj = {className: 'test', width: '2em'}, str = '.<className> {position: absolute;width:<width>}'
	 * 结果：'.test{position:absolute;width:2em}'
	 */
	replaceCss: function(obj, str) {
		for(var key in obj) {
			var reg = new RegExp("<" + key + ">", "g");
			str = str.replace(reg, obj[key]);
		}
		return str;
	}
};

window.Loading = Loading;

if (typeof module != 'undefined' && module.exports) {
	module.exports = Loading;
}