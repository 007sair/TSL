/*
 * 1. loading初始只插入css
 * 2. 多tab时需主动插入html  如果没有  就插入再显示 有就直接显示
 */

//默认值
var defaults = {
	
};

function Loading(options) {

	this.opts = $.extend({}, {
		styleID: '__loading_style__',
		className: '__loading__',
		icon: 'https://img.miyabaobei.com/d1/p4/2016/11/28/0e/c1/0ec12ebad6c4e9d7bb53467455158410024083338.png',
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
	this.container = $('body');
}

Loading.prototype = {
	constructor: Loading,
	init: function() {
		this.insertCSS();
	},
	/*
	 * .__loading__{text-align:center;font-size:12px;color:#666;line-height:44px;visibility:hidden}
	 * .__loading__ i{margin-right:8px;background:url(icon.png) no-repeat;background-size:20px;width:20px;height:20px}
	 * .__loading__ *{display:inline-block;vertical-align:middle;}
	 * .__loading__ input{border:1px solid #f2f2f2;padding:0 40px;height:44px}
	 */
	insertCSS: function() {
		if(document.getElementById(this.opts.styleID)) return false;
		var style = document.createElement('style');
		style.id = this.opts.styleID;

		var str_css = [
			'.<className>{text-align:center;font-size:<size>px;color:#666;height:<multi>em;line-height:<multi>em;visibility:hidden;}',
			'.<className> i{display:inline-block;vertical-align:middle;margin-right:0.3em;background:url(<icon>) no-repeat;background-size:100%;width:0.9em;height:0.9em;}',
			'.<className> span{display:inline-block;vertical-align:middle;font-size:0.7em;}',
			'.<className> input{border:1px solid #f2f2f2;width:62.5%;height:100%;padding:0;margin:0 auto;display:block;font-size:0.7em;}'
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