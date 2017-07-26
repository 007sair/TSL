/**
 * 上滑加载
 * -------
 * 1. 依赖Loading模块
 * 2. 多tab上滑加载，最好先使用getContainer设置Loading所在位置
 */

//loading module
var Loading = require('./loading.js');

function ScrollLoad(options) {
	//config
	this.opt = $.extend({}, {
		autoLoad: false, 			//第一次自动加载，不足一屏继续自动加载直到数据占满一屏，默认不加载
		render: function() {}, 		//上滑触发
		afterRender: function() {} 	//render后回调函数 一般用于ajax异步中
	}, options);

	this.loader = new Loading(this.opt.loading);  //loading对象，包含了对loading的所有属性与操作

	this.WINDOW_HEIGHT = $(window).height();
	this.render = this.opt.render;
	this.afterRender = function() {}; 	//异步加载完成的回调
	
	this.timer = null; //load定时器
	this.isStopLoad = false; //是否禁止滚动事件
	this.isStopLoop = false; //是否停止自动加载

	this.scroll = function() {};

	this.init();
}

ScrollLoad.prototype = {
	constructor: ScrollLoad,
	init: function() {
		this.loader.init();  //初始化loading，插入loading需要的样式
		this.bindEvent();	 //绑定滚动事件

		this.opt.autoLoad && this.autoLoad();
	},
	/**
	 * 多tab时需将loading div插入到对应tab下
	 * 多选项卡切换时，需要外部调用并传入当前容器(当前容器为jq对象),再执行load函数
	 * 非多选项卡切换时，可以不调用，loading默认被加到body容器下
	 */
	getContainer: function($container) { //$container jq对象
		this.loader.container = $container || $(document.body);
	},
	/**
	 * 显示loading，调用外部render函数
	 * render函数的参数为异步回调函数，通常用于ajax成功获取数据后
	 */
	load: function(callback) { //参数：回调函数，此函数需放入ajax.success内执行
		var me = this;
		function loop() {
			if (me.isStopLoad) return false;
			me.loader.show();
			clearTimeout(me.timer);
			me.timer = setTimeout(function() {
				me.render(function() {
					if (!me.isStopLoop && !me.isOutScreen()) { //如果页面没有超过一屏，继续加载
						setTimeout(loop, 200);
					} else {
						console.log('load complate!');
						callback && callback();
						me.afterRender();
					}
				})
			}, 500);
		}
		loop();
	},
	/**
	 * 数据加载失败，重新加载功能
	 */
	reload: function() {
		var me = this;
		var _loader = this.loader;
		_loader.inform('<input value="重新加载" class="reloadBtn" type="button">');
		_loader.container.find('.' + _loader.className).on('click', '.reloadBtn', function() {
			_loader.inform(_loader.opts.html);
			me.load();
		});
	},
	noData: function() {
		//没有数据的时候调用 1、 提示到底 2、禁用滚动时间
		this.loader.inform('- 到底啦 -');
		this.isStopLoad = true;
	},
	/**
	 * 绑定事件
	 */
	bindEvent: function() {
		var me = this;
		window.addEventListener('scroll', function () {
			if (me.loader.isLoading() || me.isStopLoad) return false;
			var docHeight = $(document.body).height();
			var scrollTop = $(window).scrollTop();
			if (scrollTop >= docHeight - me.WINDOW_HEIGHT) { //满足到底部的条件
				me.load();
			}

			//给外部的事件函数
			me.scroll(scrollTop);
		});
	},
	/**
	 * 阻止一次scroll时间，然后立即解除阻止
	 */
	stopEventOnce: function() {
		var me = this;
		me.isStopLoad = true;
		setTimeout(function() {
			me.isStopLoad = false;
		}, 300)
	},
	stopEvent: function() {
		this.isStopLoad = true;
	},
	stopLoop: function() {
		this.isStopLoop = true;
	},
	isOutScreen: function() {
		//如果当前容器的高度+距离顶部的距离 大于 屏幕高度 说明超过一屏
		if (this.loader.container.height() + this.loader.container.offset().top > this.WINDOW_HEIGHT) {
			return true
		}
		return false
	}
};

window.ScrollLoad = ScrollLoad;

if (typeof module != 'undefined' && module.exports) {
	module.exports = ScrollLoad;
}