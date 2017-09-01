/**
 * TSL(Tab-Scroll-Load)
 * tab切换、ajax数据加载、向上滑动加载
 */

//lib
var IScroll = require('./lib/iscroll-lite.js'); //iScroll轻量版

//mods
require('./mods/sticky.js'); //解决移动端fixed平滑吸顶
var Loading = require('./mods/loading.js');

function TSL(options) {

	//配置项
	this.opts = $.extend(true, {
		isDisableAutoLoad: false,	//是否禁用自动加载，默认不禁用
		isDisableScroll: false,		//是否禁用上滑加载，默认不禁用 为true时，this.opts.scroll函数也会失效
		defaultTabIndex: 0,			//默认选中、显示第1个tab
		startPage: 1,				//开始页数
		iScroll: '.J_iScroll',		//iScroll引用class，为null时可禁用iscroll
		isTabSticky: true,			//是否使用tab悬浮
		className: {
			tabWrap: 'J_tabWrap',			//tab外层包裹容器样式名
			tabActive: 'tab-active',		//tab选中样式
			tabTag: 'li',					//tab点击元素标签名，默认li
        	contWrap: 'J_contWrap',			//cont外层包裹容器样式名
			contActive: 'cont-active', 		//tab选中样式对应的容器样式
			cont: 'cont',					//cont容器名，与html中的名称对应上
        	items: '__items__'				//cont容器内用来包裹数据的容器样式名，与__loading__并列
		},
		load: function() {
			//开始加载数据
		},				
		render: function (data) {
			//渲染函数，传入的data为ajax数据
			//this.$item为当前tab对应的cont容器对象，可以将data数据渲染到其中
		},
		tabClick: function($obj) {
			//tab点击事件，$obj为当前被点击的元素，jq对象
		},				
		scroll: function(scrollTop) {
			//scroll事件 scrollTop为滚动页面时的top值
		}
	}, options);

	this.WINDOW_HEIGHT = $(window).height();

	//jquery obj
	this.$tabWrap = $('.' + this.opts.className.tabWrap);	//tab容器
	this.$contWrap = $('.' + this.opts.className.contWrap);	//conts容器
	this.$cont = null; 		//cont容器
	this.$items = null;		//tan选中时，cont对应存放数据的容器，应为<div class="__items__"></div>
	
	//tab选项卡信息，存放一些由this.model生成的对象，没有选项卡时只有1组数据
	this.arr_tab = [];

	//当前选项卡索引，没有选项卡时默认为0
	this.curTabIndex = this.opts.defaultTabIndex || 0;

	//当前tab的数据，数据结构来自this.model
	this.oCurTab = {};

	//根据tab判断页面是否有选项卡
	this.isHasTab = this.$tabWrap.length ? true : false;

	this.y = 0; //window.scrollTo(x, y)的第二个参数

	this.loader = new Loading(this.opts.loading);

	this.timer = null; 			//load定时器

	this.init();
}

TSL.prototype = {
	init: function() { //做一些初始化工作
		//初始化loading，插入loading需要的样式
		this.loader.init();
		this.setSticky();
		this.setIScroll();
		this.bindClick();
		this.setDOM();
		this.start();
		this.bindEvent();
	},
	/**
	 * 开始启动TSL
	 * 每个tab数据都有一个isEnd
	 */
	start: function() {
		if (this.arr_tab[this.curTabIndex].isEnd) {
			return false
		}
		var me = this;
		me.getContainer();
		me.loader.show();
		clearTimeout(me.timer);
		me.timer = setTimeout(function() {
			me.opts.load.call(me);
		}, 500);
	},
	render: function (data) { //外部ajax成功时调用，data为ajax传入的数据
		var me = this;
		this.$items = this.$cont.eq(this.curTabIndex).find('.' + this.opts.className.items);
		this.opts.render.call(this, data);
		this.oCurTab.page++;
		this.oCurTab.isRender = true;
		this.loader.inform('- 上滑继续加载 -');

		if (!this.opts.isDisableAutoLoad && !this.isOut()) { //没有禁用自动加载 & 页面没有超过一屏，继续加载
			me.start();
		} else {
			this.setMinHeight();
		}
	},
	fail: function (msg) {
		this.oCurTab.isEnd = true;
		this.loader.inform(msg);
		this.setMinHeight();
	},
	bindClick: function() {
		if (!this.isHasTab) {
			return false;
		}
		var me = this;

		this.$tabWrap.on('click', me.opts.className.tabTag, function() {
			
			if ($(this).hasClass(me.opts.className.tabActive)) {
				return false
			};

			var index = $(this).index();
			me.curTabIndex = index;
			me.oCurTab = me.arr_tab[index];

			$(this).addClass(me.opts.className.tabActive)
				   .siblings(me.opts.className.tabTag).removeClass(me.opts.className.tabActive);

			me.$cont.eq(index).addClass(me.opts.className.contActive).show()
			  .siblings('.' + me.opts.className.cont).removeClass(me.opts.className.contActive).hide();

			if (me.opts.iScroll) {
				setTimeout(function () {
					window.myScroll.scrollToElement("li:nth-child(" + (index + 1) + ")", 200, true);
				}, 200);
			}

			//重新获取当前cont容器

			/**
			 * bug：切换tab时会触发底部上滑加载，导致无效加载。
			 * 本逻辑为切换tab时记录跳转位置：
			 * -----------------------------------------
			 * 如果tab悬浮
			 *    如果是第一次渲染，就让页面位于tab刚好悬浮位置
			 *    如果不是第一次，让页面位于记录的scroll值位置
			 * 如果tab没有悬浮
			 *    点任何tab,都不会触发scrollTo。
			 *    需要重置当前tab的scroll值为当前scrollTop
			 * 【注释①】，复现步骤：
			 *    a.点击tab1，滑动页面使tab悬浮，记下当前商品位置
			 *	  b.点击其他tab并将tab置为非悬浮，再点tab1
			*	  c.在非悬浮状态，从tab1点回刚才tab，然后使tab悬浮
			*	  d.点tab1，理论上tab1此时应该显示第一个商品（步骤b并未重置），不加这句会让显示商品变成步骤a的商品位置
			*/
			var cur_scroll = me.oCurTab.scroll;
			if (me.opts.isTabSticky && me.sticky.isFixed) { //支持sticky && tab悬浮
				if (!me.oCurTab.isRender) { //首次渲染
					window.scrollTo(0, me.y);
					me.start();
				} else { //不是首次渲染
					//如果其他tab为非悬浮状态，需要强制让其悬浮，否则页面会从tab悬浮变为tab非悬浮，影响用户体验
					cur_scroll = cur_scroll < me.sticky.arr_tops[0] ? me.y : cur_scroll;
					window.scrollTo(0, cur_scroll);
				}
			} else { //如果tab没有悬浮，直接跳到上个tab的滚动位置
				me.oCurTab.scroll = $(window).scrollTop(); //见：注释①
				if (!me.oCurTab.isRender) {
					me.start();
				}
			}

			//暴露click事件
			me.opts.tabClick.call(me, $(this));
		});
	},
	bindEvent: function() {
		var me = this;
		window.addEventListener('scroll', function () {
			if (me.opts.isDisableScroll || me.loader.isLoading()) {
				return false
			}
			var scrollTop = $(window).scrollTop();
			var docHeight = $(document.body).height();
			if (scrollTop >= docHeight - me.WINDOW_HEIGHT) { //满足到底部的条件
				me.start();
			}

			if (me.isHasTab) {
				me.oCurTab.scroll = scrollTop; //根据滚动，记录当前tab的数据
			}

			//暴露滚动事件
			me.opts.scroll.call(me, scrollTop);
		});
	},
	getContainer: function() {
		var $container = this.$cont.eq(this.curTabIndex);
		this.loader.container = $container;
	},
	isOut: function() {
		//如果当前容器的高度+距离顶部的距离 大于 屏幕高度 说明超过一屏
		return (this.loader.container.height() + this.loader.container.offset().top > this.WINDOW_HEIGHT) ? true : false
	},
	/**
	 * 设置最小高
	 */
	setMinHeight: function () {
		if (this.isSetMinHeight) {
			return false
		}
		if (this.isOut() && this.isHasTab) { //当超过一屏，才会设置最小高，避免切换tab页面高度不够一屏导致tab上下跳动
			this.$contWrap.css('min-height', this.WINDOW_HEIGHT);
			this.isSetMinHeight = true;
		}
	},
	/**
	 * 设置tab悬浮
	 */
	setSticky: function () {
		if (this.isHasTab && this.opts.isTabSticky) { //使用tab悬浮
			this.sticky = this.$tabWrap.sticky({
				top: -1
			});
			//只有悬浮，才有跳转的意义
			this.y = this.sticky.arr_tops[0] + 2; //跳转悬浮位置，+2是为了保证处于悬浮状态
		}
	},
	/**
	 * 设置iscroll
	 */
	setIScroll: function () {
		if (this.isHasTab && this.opts.iScroll) { //如果有tab并且iScroll引用正确
			window.myScroll = new IScroll(this.opts.iScroll, {
				fixedScrollBar: true,
				bindToWrapper: false,
				eventPassthrough: true,
				scrollX: true,
				scrollY: false,
				preventDefault: false
			});
		}
	},
	/**
	 * 根据tab个数设置cont容器
	 * 初始化tab数据数组arr_tab，数组每个元素都是一个对象，对象属性来自model
	 */
	setDOM: function () {
		var me = this;
		var sCont = '';
		//数据模型，不存放实际数据，供oCurTab使用
		var model = {
			page: this.opts.startPage,   //起始页数，默认为1
			isRender: false,			 //是否渲染过，默认未渲染
			isEnd: false, 		//是否结束，默认未结束，结束时停止调用load方法
			scroll: 0			//scrollTop值
		};
		if (this.isHasTab) {
			//初始化dom和一些数据
			this.$tabWrap.find(me.opts.className.tabTag).each(function (index, el) {
				//根据数据模型初始化每个tab的数据
				me.arr_tab.push($.extend(true, {}, model));
				sCont += '<div class="'+ me.opts.className.cont +' '+ (index == 0 ? me.opts.className.contActive : '') +'">\
								<div class="'+ me.opts.className.items +'"></div>\
							</div>';
			});
		} else {
			this.arr_tab.push($.extend(true, {}, model));
			sCont += '<div class="'+ me.opts.className.cont +' '+ me.opts.className.contActive +'">\
								<div class="'+ me.opts.className.items +'"></div>\
						</div>';
		}
		//根据li个数，创建cont容器
		this.$contWrap.html(sCont);
		this.$cont = this.$contWrap.find('.' + this.opts.className.cont);

		//获取当前cont容器
		this.$items = this.$cont.eq(this.curTabIndex).find('.' + this.opts.className.items);
		
		//有了arr_tab后可以获取到默认tab数据
		me.oCurTab = me.arr_tab[me.curTabIndex];
	},
	/**
	 * 重新加载功能
	 */
	reload: function() {
		var me = this;
		me.loader.loading.html('<input value="重新加载" class="reloadBtn" type="button">');
		me.$cont.on('click', '.reloadBtn', function() {
			me.oCurTab.isEnd = false;
			me.start();
		});
	}
};

window.TSL = TSL;

if (typeof module != 'undefined' && module.exports) {
	module.exports = TSL;
}


